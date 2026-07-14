//! IP-NFT — Intellectual Property Non-Fungible Token on Stellar Soroban
//! Each token represents a unique research IP asset owned by a researcher.

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    Address, Env, Map, String, Symbol, Vec,
};

// ── Storage keys ─────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    NextTokenId,
    TokenOwner(u64),
    TokenData(u64),
    OwnerTokens(Address),
    MintFee,
    Treasury,
    Fractionalized(u64),
}

// ── Data types ────────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct IpNftData {
    pub title: String,
    pub research_area: String,
    pub researcher: Address,
    pub token_uri: String,
    pub funding_goal: i128,   // in stroops (1 XLM = 10^7 stroops)
    pub current_funding: i128,
    pub minted_at: u64,       // ledger timestamp
    pub fractionalized: bool,
}

// ── Events ────────────────────────────────────────────────────────────────────

fn emit_mint(env: &Env, token_id: u64, researcher: &Address, title: &String) {
    let topics = (Symbol::new(env, "ip_nft_minted"), token_id, researcher.clone());
    env.events().publish(topics, title.clone());
}

fn emit_transfer(env: &Env, from: &Address, to: &Address, token_id: u64) {
    let topics = (Symbol::new(env, "transfer"), from.clone(), to.clone());
    env.events().publish(topics, token_id);
}

fn emit_funded(env: &Env, token_id: u64, funder: &Address, amount: i128) {
    let topics = (Symbol::new(env, "funded"), token_id, funder.clone());
    env.events().publish(topics, amount);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

fn next_token_id(env: &Env) -> u64 {
    let id: u64 = env
        .storage()
        .persistent()
        .get(&DataKey::NextTokenId)
        .unwrap_or(0);
    env.storage()
        .persistent()
        .set(&DataKey::NextTokenId, &(id + 1));
    id
}

fn add_token_to_owner(env: &Env, owner: &Address, token_id: u64) {
    let mut tokens: Vec<u64> = env
        .storage()
        .persistent()
        .get(&DataKey::OwnerTokens(owner.clone()))
        .unwrap_or_else(|| Vec::new(env));
    tokens.push_back(token_id);
    env.storage()
        .persistent()
        .set(&DataKey::OwnerTokens(owner.clone()), &tokens);
}

fn remove_token_from_owner(env: &Env, owner: &Address, token_id: u64) {
    let tokens: Vec<u64> = env
        .storage()
        .persistent()
        .get(&DataKey::OwnerTokens(owner.clone()))
        .unwrap_or_else(|| Vec::new(env));
    let mut new_tokens = Vec::new(env);
    for t in tokens.iter() {
        if t != token_id {
            new_tokens.push_back(t);
        }
    }
    env.storage()
        .persistent()
        .set(&DataKey::OwnerTokens(owner.clone()), &new_tokens);
}

// ── Contract ──────────────────────────────────────────────────────────────────

#[contract]
pub struct IpNft;

#[contractimpl]
impl IpNft {
    /// Initialize the contract
    pub fn initialize(env: Env, admin: Address, treasury: Address, mint_fee: i128) {
        if env.storage().persistent().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().persistent().set(&DataKey::Admin, &admin);
        env.storage().persistent().set(&DataKey::Treasury, &treasury);
        env.storage().persistent().set(&DataKey::MintFee, &mint_fee);
        env.storage().persistent().set(&DataKey::NextTokenId, &0u64);
    }

    /// Mint a new IP-NFT representing research intellectual property
    pub fn mint(
        env: Env,
        researcher: Address,
        title: String,
        research_area: String,
        token_uri: String,
        funding_goal: i128,
    ) -> u64 {
        researcher.require_auth();

        assert!(!title.is_empty(), "title required");
        assert!(funding_goal > 0, "funding goal must be positive");

        let token_id = next_token_id(&env);
        let data = IpNftData {
            title: title.clone(),
            research_area,
            researcher: researcher.clone(),
            token_uri,
            funding_goal,
            current_funding: 0,
            minted_at: env.ledger().timestamp(),
            fractionalized: false,
        };

        env.storage()
            .persistent()
            .set(&DataKey::TokenOwner(token_id), &researcher);
        env.storage()
            .persistent()
            .set(&DataKey::TokenData(token_id), &data);
        add_token_to_owner(&env, &researcher, token_id);

        emit_mint(&env, token_id, &researcher, &title);
        token_id
    }

    /// Transfer an IP-NFT to a new owner
    pub fn transfer(env: Env, from: Address, to: Address, token_id: u64) {
        from.require_auth();
        let owner: Address = env
            .storage()
            .persistent()
            .get(&DataKey::TokenOwner(token_id))
            .expect("token does not exist");
        assert!(owner == from, "not token owner");

        env.storage()
            .persistent()
            .set(&DataKey::TokenOwner(token_id), &to);
        remove_token_from_owner(&env, &from, token_id);
        add_token_to_owner(&env, &to, token_id);

        emit_transfer(&env, &from, &to, token_id);
    }

    /// Record funding received for a specific IP-NFT
    pub fn record_funding(env: Env, token_id: u64, funder: Address, amount: i128) {
        // Only callable by the research-funding contract (stored as admin for simplicity)
        let admin: Address = env.storage().persistent().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let mut data: IpNftData = env
            .storage()
            .persistent()
            .get(&DataKey::TokenData(token_id))
            .expect("token does not exist");
        data.current_funding += amount;
        env.storage()
            .persistent()
            .set(&DataKey::TokenData(token_id), &data);

        emit_funded(&env, token_id, &funder, amount);
    }

    /// Mark token as fractionalized
    pub fn set_fractionalized(env: Env, token_id: u64, status: bool) {
        let admin: Address = env.storage().persistent().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let mut data: IpNftData = env
            .storage()
            .persistent()
            .get(&DataKey::TokenData(token_id))
            .expect("token does not exist");
        data.fractionalized = status;
        env.storage()
            .persistent()
            .set(&DataKey::TokenData(token_id), &data);
    }

    // ── Views ─────────────────────────────────────────────────────────────────

    pub fn owner_of(env: Env, token_id: u64) -> Address {
        env.storage()
            .persistent()
            .get(&DataKey::TokenOwner(token_id))
            .expect("token does not exist")
    }

    pub fn token_data(env: Env, token_id: u64) -> IpNftData {
        env.storage()
            .persistent()
            .get(&DataKey::TokenData(token_id))
            .expect("token does not exist")
    }

    pub fn tokens_of(env: Env, owner: Address) -> Vec<u64> {
        env.storage()
            .persistent()
            .get(&DataKey::OwnerTokens(owner))
            .unwrap_or_else(|| Vec::new(&env))
    }

    pub fn total_supply(env: Env) -> u64 {
        env.storage()
            .persistent()
            .get(&DataKey::NextTokenId)
            .unwrap_or(0)
    }

    pub fn mint_fee(env: Env) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::MintFee)
            .unwrap_or(0)
    }

    pub fn set_mint_fee(env: Env, new_fee: i128) {
        let admin: Address = env.storage().persistent().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.storage().persistent().set(&DataKey::MintFee, &new_fee);
    }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn test_mint_and_owner() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(IpNft, ());
        let client = IpNftClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let researcher = Address::generate(&env);
        let treasury = Address::generate(&env);

        client.initialize(&admin, &treasury, &10_000_000i128);

        let token_id = client.mint(
            &researcher,
            &String::from_str(&env, "Telomere Extension Study"),
            &String::from_str(&env, "Longevity"),
            &String::from_str(&env, "ipfs://QmTest"),
            &50_0000000i128,
        );

        assert_eq!(token_id, 0);
        assert_eq!(client.owner_of(&token_id), researcher);
        assert_eq!(client.total_supply(), 1);

        let data = client.token_data(&token_id);
        assert_eq!(data.title, String::from_str(&env, "Telomere Extension Study"));
        assert_eq!(data.funding_goal, 50_0000000i128);
    }

    #[test]
    fn test_transfer() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(IpNft, ());
        let client = IpNftClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let researcher = Address::generate(&env);
        let buyer = Address::generate(&env);
        let treasury = Address::generate(&env);

        client.initialize(&admin, &treasury, &10_000_000i128);
        let token_id = client.mint(
            &researcher,
            &String::from_str(&env, "Study"),
            &String::from_str(&env, "Aging"),
            &String::from_str(&env, "ipfs://Qm1"),
            &10_0000000i128,
        );

        client.transfer(&researcher, &buyer, &token_id);
        assert_eq!(client.owner_of(&token_id), buyer);
    }
}
