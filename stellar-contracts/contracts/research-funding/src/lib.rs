#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    token::Interface as TokenInterface,
    Address, Env, String, Symbol, Vec,
};

const PLATFORM_FEE_BPS: u32 = 200;
const MAX_DURATION_DAYS: u64 = 365;
const DAY_LEDGERS: u64 = 17280;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    FeeRecipient,
    CampaignCount,
    Campaign(u64),
    Contribution(u64, Address),
    Contributors(u64),
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Campaign {
    pub id: u64,
    pub researcher: Address,
    pub title: String,
    pub description: String,
    pub research_area: String,
    pub goal: i128,
    pub raised: i128,
    pub deadline_ledger: u32,
    pub withdrawn: bool,
    pub cancelled: bool,
}

fn emit_campaign_created(env: &Env, id: u64, researcher: &Address, title: &String, goal: i128) {
    let topics = (Symbol::new(env, "campaign_created"), id, researcher.clone());
    env.events().publish(topics, (title.clone(), goal));
}

fn emit_contributed(env: &Env, id: u64, contributor: &Address, amount: i128) {
    let topics = (Symbol::new(env, "contributed"), id, contributor.clone());
    env.events().publish(topics, amount);
}

fn emit_withdrawn(env: &Env, id: u64, researcher: &Address, amount: i128) {
    let topics = (Symbol::new(env, "withdrawn"), id, researcher.clone());
    env.events().publish(topics, amount);
}

fn emit_refunded(env: &Env, id: u64, contributor: &Address, amount: i128) {
    let topics = (Symbol::new(env, "refunded"), id, contributor.clone());
    env.events().publish(topics, amount);
}

fn emit_campaign_cancelled(env: &Env, id: u64) {
    let topics = (Symbol::new(env, "campaign_cancelled"), id);
    env.events().publish(topics, ());
}

fn save_campaign(env: &Env, campaign: &Campaign) {
    env.storage().persistent().set(&DataKey::Campaign(campaign.id), campaign);
}

fn get_campaign(env: &Env, id: u64) -> Campaign {
    env.storage().persistent().get(&DataKey::Campaign(id)).expect("campaign not found")
}

fn add_contributor(env: &Env, campaign_id: u64, contributor: &Address) {
    let mut list: Vec<Address> = env.storage()
        .persistent()
        .get(&DataKey::Contributors(campaign_id))
        .unwrap_or_else(|| Vec::new(env));
    let mut found = false;
    for c in list.iter() {
        if c == *contributor {
            found = true;
            break;
        }
    }
    if !found {
        list.push_back(contributor.clone());
        env.storage().persistent().set(&DataKey::Contributors(campaign_id), &list);
    }
}

fn get_contribution(env: &Env, campaign_id: u64, contributor: &Address) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::Contribution(campaign_id, contributor.clone()))
        .unwrap_or(0)
}

fn xlm_client(env: &Env) -> TokenInterface {
    let xlm_id = env.register_stellar_asset(None);
    TokenInterface::new(env, &xlm_id)
}

#[contract]
pub struct ResearchFunding;

#[contractimpl]
impl ResearchFunding {
    pub fn initialize(env: Env, admin: Address, fee_recipient: Address) {
        if env.storage().persistent().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().persistent().set(&DataKey::Admin, &admin);
        env.storage().persistent().set(&DataKey::FeeRecipient, &fee_recipient);
        env.storage().persistent().set(&DataKey::CampaignCount, &0u64);
    }

    pub fn create_campaign(
        env: Env,
        title: String,
        description: String,
        research_area: String,
        goal: i128,
        duration_days: u64,
    ) -> u64 {
        assert!(goal > 0, "goal must be positive");
        assert!(duration_days > 0 && duration_days <= MAX_DURATION_DAYS, "invalid duration");
        assert!(!title.is_empty(), "title required");

        let researcher = env.invoker();
        let mut count: u64 = env.storage().persistent().get(&DataKey::CampaignCount).unwrap_or(0);
        let id = count;
        count += 1;
        env.storage().persistent().set(&DataKey::CampaignCount, &count);

        let campaign = Campaign {
            id,
            researcher: researcher.clone(),
            title: title.clone(),
            description,
            research_area,
            goal,
            raised: 0,
            deadline_ledger: env.ledger().sequence() + (duration_days as u32 * DAY_LEDGERS as u32),
            withdrawn: false,
            cancelled: false,
        };
        save_campaign(&env, &campaign);
        emit_campaign_created(&env, id, &researcher, &title, goal);
        id
    }

    pub fn contribute(env: Env, campaign_id: u64, amount: i128) {
        let contributor = env.invoker();
        let mut campaign = get_campaign(&env, campaign_id);
        assert!(!campaign.cancelled, "campaign cancelled");
        assert!(env.ledger().sequence() < campaign.deadline_ledger, "campaign ended");
        assert!(amount > 0, "must send positive amount");

        let xlm = xlm_client(&env);
        xlm.transfer(&contributor, &env.current_contract_address(), &amount);

        let prev = get_contribution(&env, campaign_id, &contributor);
        env.storage().persistent().set(
            &DataKey::Contribution(campaign_id, contributor.clone()),
            &(prev + amount),
        );

        campaign.raised += amount;
        save_campaign(&env, &campaign);
        add_contributor(&env, campaign_id, &contributor);
        emit_contributed(&env, campaign_id, &contributor, amount);
    }

    pub fn withdraw(env: Env, campaign_id: u64) {
        let researcher = env.invoker();
        let campaign = get_campaign(&env, campaign_id);
        assert!(researcher == campaign.researcher, "not researcher");
        assert!(campaign.raised >= campaign.goal, "goal not reached");
        assert!(!campaign.withdrawn, "already withdrawn");
        assert!(!campaign.cancelled, "campaign cancelled");

        let mut updated = campaign.clone();
        updated.withdrawn = true;
        save_campaign(&env, &updated);

        let fee = (campaign.raised * PLATFORM_FEE_BPS as i128) / 10000;
        let payout = campaign.raised - fee;

        let xlm = xlm_client(&env);
        if fee > 0 {
            let fee_recipient: Address = env.storage().persistent().get(&DataKey::FeeRecipient).unwrap();
            xlm.transfer(&env.current_contract_address(), &fee_recipient, &fee);
        }
        if payout > 0 {
            xlm.transfer(&env.current_contract_address(), &researcher, &payout);
        }

        emit_withdrawn(&env, campaign_id, &researcher, payout);
    }

    pub fn refund(env: Env, campaign_id: u64) {
        let contributor = env.invoker();
        let campaign = get_campaign(&env, campaign_id);
        let expired = env.ledger().sequence() >= campaign.deadline_ledger && campaign.raised < campaign.goal;
        assert!(campaign.cancelled || expired, "not eligible for refund");

        let amount = get_contribution(&env, campaign_id, &contributor);
        assert!(amount > 0, "no contribution");

        env.storage().persistent().remove(&DataKey::Contribution(campaign_id, contributor.clone()));

        let xlm = xlm_client(&env);
        xlm.transfer(&env.current_contract_address(), &contributor, &amount);

        emit_refunded(&env, campaign_id, &contributor, amount);
    }

    pub fn cancel_campaign(env: Env, campaign_id: u64) {
        let caller = env.invoker();
        let admin: Address = env.storage().persistent().get(&DataKey::Admin).unwrap();
        let campaign = get_campaign(&env, campaign_id);
        assert!(caller == campaign.researcher || caller == admin, "unauthorized");
        assert!(!campaign.withdrawn, "already withdrawn");
        assert!(!campaign.cancelled, "already cancelled");

        let mut updated = campaign;
        updated.cancelled = true;
        save_campaign(&env, &updated);
        emit_campaign_cancelled(&env, campaign_id);
    }

    pub fn campaign(env: Env, campaign_id: u64) -> Campaign {
        get_campaign(&env, campaign_id)
    }

    pub fn contribution(env: Env, campaign_id: u64, contributor: Address) -> i128 {
        get_contribution(&env, campaign_id, &contributor)
    }

    pub fn campaign_count(env: Env) -> u64 {
        env.storage().persistent().get(&DataKey::CampaignCount).unwrap_or(0)
    }

    pub fn get_contributors(env: Env, campaign_id: u64) -> Vec<Address> {
        env.storage()
            .persistent()
            .get(&DataKey::Contributors(campaign_id))
            .unwrap_or_else(|| Vec::new(&env))
    }

    pub fn get_progress(env: Env, campaign_id: u64) -> u64 {
        let campaign = get_campaign(&env, campaign_id);
        if campaign.goal == 0 {
            return 0;
        }
        let progress = (campaign.raised * 100) / campaign.goal;
        if progress > 100 { 100 } else { progress as u64 }
    }

    pub fn set_fee_recipient(env: Env, new_recipient: Address) {
        let admin: Address = env.storage().persistent().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.storage().persistent().set(&DataKey::FeeRecipient, &new_recipient);
    }

    pub fn admin(env: Env) -> Address {
        env.storage().persistent().get(&DataKey::Admin).unwrap()
    }

    pub fn fee_recipient(env: Env) -> Address {
        env.storage().persistent().get(&DataKey::FeeRecipient).unwrap()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    fn setup_test() -> (Env, Address, Address, Address) {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(ResearchFunding, ());
        let client = ResearchFundingClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        let researcher = Address::generate(&env);
        let fee_recipient = Address::generate(&env);
        client.initialize(&admin, &fee_recipient);
        (env, admin, researcher, fee_recipient)
    }

    #[test]
    fn test_create_campaign() {
        let (env, _admin, researcher, _fr) = setup_test();
        let client = ResearchFundingClient::new(&env, &env.register(ResearchFunding, ()));
        client.initialize(&Address::generate(&env), &Address::generate(&env));

        let id = client.create_campaign(
            &String::from_str(&env, "Longevity Study"),
            &String::from_str(&env, "Research on telomere extension"),
            &String::from_str(&env, "Longevity"),
            &100_0000000i128,
            &30u64,
        );
        assert_eq!(id, 0);
        let camp = client.campaign(&id);
        assert_eq!(camp.title, String::from_str(&env, "Longevity Study"));
        assert_eq!(camp.goal, 100_0000000i128);
    }

    #[test]
    fn test_get_progress() {
        let (_env, _admin, _researcher, _fr) = setup_test();
    }
}
