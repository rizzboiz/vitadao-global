#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    token, Address, Env, String, Symbol, Vec,
};

const VOTING_DELAY: u32 = 1;
const VOTING_PERIOD: u32 = 50400;
const PROPOSAL_THRESHOLD: i128 = 100 * 10_000_000;
const QUORUM_PERCENT: u32 = 4;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    TokenAddress,
    ProposalCount,
    Proposal(u64),
    Vote(u64, Address),
    HasVoted(u64, Address),
    ProposalVoters(u64),
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Proposal {
    pub id: u64,
    pub title: String,
    pub description: String,
    pub proposer: Address,
    pub targets: Vec<Address>,
    pub values: Vec<i128>,
    pub calldata: Vec<String>,
    pub start_ledger: u32,
    pub end_ledger: u32,
    pub for_votes: i128,
    pub against_votes: i128,
    pub abstain_votes: i128,
    pub executed: bool,
    pub cancelled: bool,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Vote {
    pub support: u32,
    pub weight: i128,
    pub reason: String,
}

fn emit_proposal_created(env: &Env, id: u64, proposer: &Address, title: &String) {
    let topics = (Symbol::new(env, "proposal_created"), id, proposer.clone());
    env.events().publish(topics, title.clone());
}

fn emit_vote_cast(env: &Env, proposal_id: u64, voter: &Address, support: u32, weight: i128) {
    let topics = (Symbol::new(env, "vote_cast"), proposal_id, voter.clone());
    env.events().publish(topics, (support, weight));
}

fn emit_proposal_executed(env: &Env, id: u64) {
    let topics = (Symbol::new(env, "proposal_executed"), id);
    env.events().publish(topics, ());
}

fn get_proposal(env: &Env, id: u64) -> Proposal {
    env.storage().persistent().get(&DataKey::Proposal(id)).expect("proposal not found")
}

fn save_proposal(env: &Env, proposal: &Proposal) {
    env.storage().persistent().set(&DataKey::Proposal(proposal.id), proposal);
}

fn get_votes(env: &Env, voter: &Address, token_addr: &Address) -> i128 {
    let vita = token::Client::new(env, token_addr);
    vita.balance(voter)
}

fn get_total_supply(env: &Env, token_addr: &Address) -> i128 {
    let vita = token::Client::new(env, token_addr);
    let supply = vita.balance(&env.current_contract_address());
    let admin: Address = env.storage().persistent().get(&DataKey::Admin).unwrap();
    let admin_bal = vita.balance(&admin);
    supply + admin_bal
}

#[contract]
pub struct Governance;

#[contractimpl]
impl Governance {
    pub fn initialize(env: Env, admin: Address, token_address: Address) {
        if env.storage().persistent().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().persistent().set(&DataKey::Admin, &admin);
        env.storage().persistent().set(&DataKey::TokenAddress, &token_address);
        env.storage().persistent().set(&DataKey::ProposalCount, &0u64);
    }

    pub fn propose(
        env: Env,
        proposer: Address,
        title: String,
        description: String,
        targets: Vec<Address>,
        values: Vec<i128>,
        calldata: Vec<String>,
    ) -> u64 {
        proposer.require_auth();
        let token_addr: Address = env.storage().persistent().get(&DataKey::TokenAddress).unwrap();
        let votes = get_votes(&env, &proposer, &token_addr);
        assert!(votes >= PROPOSAL_THRESHOLD, "insufficient voting power to propose");

        let mut count: u64 = env.storage().persistent().get(&DataKey::ProposalCount).unwrap_or(0);
        let id = count;
        count += 1;
        env.storage().persistent().set(&DataKey::ProposalCount, &count);

        let current = env.ledger().sequence();
        let proposal = Proposal {
            id,
            title: title.clone(),
            description,
            proposer: proposer.clone(),
            targets,
            values,
            calldata,
            start_ledger: current + VOTING_DELAY,
            end_ledger: current + VOTING_DELAY + VOTING_PERIOD,
            for_votes: 0,
            against_votes: 0,
            abstain_votes: 0,
            executed: false,
            cancelled: false,
        };
        save_proposal(&env, &proposal);
        emit_proposal_created(&env, id, &proposer, &title);
        id
    }

    pub fn cast_vote(env: Env, voter: Address, proposal_id: u64, support: u32, reason: String) {
        voter.require_auth();
        let mut proposal = get_proposal(&env, proposal_id);

        assert!(!proposal.cancelled, "proposal cancelled");
        assert!(!proposal.executed, "proposal executed");
        let current = env.ledger().sequence();
        assert!(current >= proposal.start_ledger, "voting not started");
        assert!(current < proposal.end_ledger, "voting ended");
        assert!(support <= 2, "invalid support value");

        let has_voted: bool = env.storage()
            .persistent()
            .get(&DataKey::HasVoted(proposal_id, voter.clone()))
            .unwrap_or(false);
        assert!(!has_voted, "already voted");

        let token_addr: Address = env.storage().persistent().get(&DataKey::TokenAddress).unwrap();
        let weight = get_votes(&env, &voter, &token_addr);
        assert!(weight > 0, "no voting power");

        match support {
            0 => proposal.against_votes += weight,
            1 => proposal.for_votes += weight,
            2 => proposal.abstain_votes += weight,
            _ => panic!("invalid support"),
        }

        save_proposal(&env, &proposal);

        let vote = Vote { support, weight, reason: reason.clone() };
        env.storage().persistent().set(&DataKey::Vote(proposal_id, voter.clone()), &vote);
        env.storage().persistent().set(&DataKey::HasVoted(proposal_id, voter.clone()), &true);

        let mut voters: Vec<Address> = env.storage()
            .persistent()
            .get(&DataKey::ProposalVoters(proposal_id))
            .unwrap_or_else(|| Vec::new(&env));
        voters.push_back(voter.clone());
        env.storage().persistent().set(&DataKey::ProposalVoters(proposal_id), &voters);

        emit_vote_cast(&env, proposal_id, &voter, support, weight);
    }

    pub fn execute(env: Env, caller: Address, proposal_id: u64) {
        caller.require_auth();
        let admin: Address = env.storage().persistent().get(&DataKey::Admin).unwrap();
        assert!(caller == admin, "only admin can execute");

        let mut proposal = get_proposal(&env, proposal_id);
        assert!(!proposal.cancelled, "proposal cancelled");
        assert!(!proposal.executed, "already executed");
        let current = env.ledger().sequence();
        assert!(current >= proposal.end_ledger, "voting not ended");

        let total_votes = proposal.for_votes + proposal.against_votes + proposal.abstain_votes;
        let token_addr: Address = env.storage().persistent().get(&DataKey::TokenAddress).unwrap();
        let total_supply = get_total_supply(&env, &token_addr);
        let quorum = (total_supply * QUORUM_PERCENT as i128) / 100;

        assert!(total_votes >= quorum, "quorum not reached");
        assert!(proposal.for_votes > proposal.against_votes, "proposal defeated");

        proposal.executed = true;
        save_proposal(&env, &proposal);
        emit_proposal_executed(&env, proposal_id);
    }

    pub fn cancel(env: Env, caller: Address, proposal_id: u64) {
        caller.require_auth();
        let admin: Address = env.storage().persistent().get(&DataKey::Admin).unwrap();
        let mut proposal = get_proposal(&env, proposal_id);
        assert!(caller == proposal.proposer || caller == admin, "unauthorized");
        assert!(!proposal.executed, "already executed");

        proposal.cancelled = true;
        save_proposal(&env, &proposal);
    }

    pub fn proposal(env: Env, proposal_id: u64) -> Proposal {
        get_proposal(&env, proposal_id)
    }

    pub fn proposal_count(env: Env) -> u64 {
        env.storage().persistent().get(&DataKey::ProposalCount).unwrap_or(0)
    }

    pub fn get_vote(env: Env, proposal_id: u64, voter: Address) -> Vote {
        env.storage()
            .persistent()
            .get(&DataKey::Vote(proposal_id, voter))
            .expect("vote not found")
    }

    pub fn has_voted(env: Env, proposal_id: u64, voter: Address) -> bool {
        env.storage()
            .persistent()
            .get(&DataKey::HasVoted(proposal_id, voter))
            .unwrap_or(false)
    }

    pub fn get_voters(env: Env, proposal_id: u64) -> Vec<Address> {
        env.storage()
            .persistent()
            .get(&DataKey::ProposalVoters(proposal_id))
            .unwrap_or_else(|| Vec::new(&env))
    }

    pub fn get_proposal_state(env: Env, proposal_id: u64) -> u32 {
        let proposal = get_proposal(&env, proposal_id);
        if proposal.cancelled {
            return 4;
        }
        if proposal.executed {
            return 5;
        }
        let current = env.ledger().sequence();
        if current < proposal.start_ledger {
            return 0;
        }
        if current <= proposal.end_ledger {
            return 1;
        }
        let total_votes = proposal.for_votes + proposal.against_votes + proposal.abstain_votes;
        let token_addr: Address = env.storage().persistent().get(&DataKey::TokenAddress).unwrap();
        let total_supply = get_total_supply(&env, &token_addr);
        let quorum = (total_supply * QUORUM_PERCENT as i128) / 100;
        if total_votes >= quorum && proposal.for_votes > proposal.against_votes {
            return 2;
        }
        3
    }

    pub fn token_address(env: Env) -> Address {
        env.storage().persistent().get(&DataKey::TokenAddress).unwrap()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn test_propose_and_vote() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(Governance, ());
        let client = GovernanceClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let voter = Address::generate(&env);
        let token_addr = Address::generate(&env);

        client.initialize(&admin, &token_addr);
        assert_eq!(client.proposal_count(), 0);
    }
}
