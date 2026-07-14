//! VITA Token — VitaDAO Governance Token on Stellar Soroban
//! SEP-41 compliant fungible token with admin minting and voting weight tracking.

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    token::Interface as TokenInterface,
    Address, Env, String, Symbol,
};

// ── Storage keys ────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    TotalSupply,
    Balance(Address),
    Allowance(Address, Address), // (owner, spender)
}

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_SUPPLY: i128 = 100_000_000 * 10_i128.pow(7); // 100M with 7 decimals
const TOKEN_NAME: &str = "VitaDAO";
const TOKEN_SYMBOL: &str = "VITA";
const DECIMALS: u32 = 7;

// ── Events ───────────────────────────────────────────────────────────────────

fn emit_transfer(env: &Env, from: &Address, to: &Address, amount: i128) {
    let topics = (Symbol::new(env, "transfer"), from.clone(), to.clone());
    env.events().publish(topics, amount);
}

fn emit_approve(env: &Env, owner: &Address, spender: &Address, amount: i128, expiration: u32) {
    let topics = (Symbol::new(env, "approve"), owner.clone(), spender.clone());
    env.events().publish(topics, (amount, expiration));
}

// ── Helpers ──────────────────────────────────────────────────────────────────

fn get_balance(env: &Env, addr: &Address) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::Balance(addr.clone()))
        .unwrap_or(0)
}

fn set_balance(env: &Env, addr: &Address, amount: i128) {
    env.storage()
        .persistent()
        .set(&DataKey::Balance(addr.clone()), &amount);
}

fn get_allowance(env: &Env, owner: &Address, spender: &Address) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::Allowance(owner.clone(), spender.clone()))
        .unwrap_or(0)
}

fn get_total_supply(env: &Env) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::TotalSupply)
        .unwrap_or(0)
}

// ── Contract ─────────────────────────────────────────────────────────────────

#[contract]
pub struct VitaToken;

#[contractimpl]
impl VitaToken {
    /// Initialize the token. Mints the full supply to the admin.
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().persistent().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().persistent().set(&DataKey::Admin, &admin);
        env.storage()
            .persistent()
            .set(&DataKey::TotalSupply, &MAX_SUPPLY);
        set_balance(&env, &admin, MAX_SUPPLY);
        emit_transfer(
            &env,
            &Address::from_string(&String::from_str(&env, "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF")),
            &admin,
            MAX_SUPPLY,
        );
    }

    /// Mint additional tokens (admin only, up to MAX_SUPPLY)
    pub fn mint(env: Env, to: Address, amount: i128) {
        let admin: Address = env.storage().persistent().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        assert!(amount > 0, "amount must be positive");
        let supply = get_total_supply(&env);
        assert!(supply + amount <= MAX_SUPPLY, "exceeds max supply");

        env.storage()
            .persistent()
            .set(&DataKey::TotalSupply, &(supply + amount));
        set_balance(&env, &to, get_balance(&env, &to) + amount);

        emit_transfer(
            &env,
            &Address::from_string(&String::from_str(
                &env,
                "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
            )),
            &to,
            amount,
        );
    }

    /// Burn tokens from caller
    pub fn burn(env: Env, from: Address, amount: i128) {
        from.require_auth();
        let bal = get_balance(&env, &from);
        assert!(bal >= amount, "insufficient balance");
        set_balance(&env, &from, bal - amount);
        let supply = get_total_supply(&env);
        env.storage()
            .persistent()
            .set(&DataKey::TotalSupply, &(supply - amount));
        emit_transfer(
            &env,
            &from,
            &Address::from_string(&String::from_str(
                &env,
                "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
            )),
            amount,
        );
    }

    /// Transfer admin role
    pub fn set_admin(env: Env, new_admin: Address) {
        let admin: Address = env.storage().persistent().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.storage().persistent().set(&DataKey::Admin, &new_admin);
    }

    pub fn admin(env: Env) -> Address {
        env.storage().persistent().get(&DataKey::Admin).unwrap()
    }

    pub fn total_supply(env: Env) -> i128 {
        get_total_supply(&env)
    }
}

// ── SEP-41 Token Interface ────────────────────────────────────────────────────

#[contractimpl]
impl TokenInterface for VitaToken {
    fn allowance(env: Env, from: Address, spender: Address) -> i128 {
        get_allowance(&env, &from, &spender)
    }

    fn approve(env: Env, from: Address, spender: Address, amount: i128, expiration_ledger: u32) {
        from.require_auth();
        assert!(amount >= 0, "amount must be non-negative");
        env.storage().persistent().set(
            &DataKey::Allowance(from.clone(), spender.clone()),
            &amount,
        );
        emit_approve(&env, &from, &spender, amount, expiration_ledger);
    }

    fn balance(env: Env, id: Address) -> i128 {
        get_balance(&env, &id)
    }

    fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        assert!(amount > 0, "amount must be positive");
        let from_bal = get_balance(&env, &from);
        assert!(from_bal >= amount, "insufficient balance");
        set_balance(&env, &from, from_bal - amount);
        set_balance(&env, &to, get_balance(&env, &to) + amount);
        emit_transfer(&env, &from, &to, amount);
    }

    fn transfer_from(env: Env, spender: Address, from: Address, to: Address, amount: i128) {
        spender.require_auth();
        assert!(amount > 0, "amount must be positive");
        let allowance = get_allowance(&env, &from, &spender);
        assert!(allowance >= amount, "insufficient allowance");
        let from_bal = get_balance(&env, &from);
        assert!(from_bal >= amount, "insufficient balance");
        env.storage().persistent().set(
            &DataKey::Allowance(from.clone(), spender.clone()),
            &(allowance - amount),
        );
        set_balance(&env, &from, from_bal - amount);
        set_balance(&env, &to, get_balance(&env, &to) + amount);
        emit_transfer(&env, &from, &to, amount);
    }

    fn burn(env: Env, from: Address, amount: i128) {
        from.require_auth();
        let bal = get_balance(&env, &from);
        assert!(bal >= amount, "insufficient balance");
        set_balance(&env, &from, bal - amount);
        let supply = get_total_supply(&env);
        env.storage()
            .persistent()
            .set(&DataKey::TotalSupply, &(supply - amount));
        emit_transfer(
            &env,
            &from,
            &Address::from_string(&String::from_str(
                &env,
                "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
            )),
            amount,
        );
    }

    fn burn_from(env: Env, spender: Address, from: Address, amount: i128) {
        spender.require_auth();
        let allowance = get_allowance(&env, &from, &spender);
        assert!(allowance >= amount, "insufficient allowance");
        let bal = get_balance(&env, &from);
        assert!(bal >= amount, "insufficient balance");
        env.storage().persistent().set(
            &DataKey::Allowance(from.clone(), spender.clone()),
            &(allowance - amount),
        );
        set_balance(&env, &from, bal - amount);
        let supply = get_total_supply(&env);
        env.storage()
            .persistent()
            .set(&DataKey::TotalSupply, &(supply - amount));
    }

    fn decimals(_env: Env) -> u32 {
        DECIMALS
    }

    fn name(env: Env) -> String {
        String::from_str(&env, TOKEN_NAME)
    }

    fn symbol(env: Env) -> String {
        String::from_str(&env, TOKEN_SYMBOL)
    }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::Env;

    #[test]
    fn test_initialize_and_balance() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(VitaToken, ());
        let client = VitaTokenClient::new(&env, &contract_id);
        let admin = Address::generate(&env);

        client.initialize(&admin);
        assert_eq!(client.balance(&admin), MAX_SUPPLY);
        assert_eq!(client.total_supply(), MAX_SUPPLY);
        assert_eq!(client.decimals(), 7);
    }

    #[test]
    fn test_transfer() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(VitaToken, ());
        let client = VitaTokenClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        let user = Address::generate(&env);

        client.initialize(&admin);
        client.transfer(&admin, &user, &1_000_0000000);

        assert_eq!(client.balance(&user), 1_000_0000000);
        assert_eq!(client.balance(&admin), MAX_SUPPLY - 1_000_0000000);
    }

    #[test]
    fn test_approve_and_transfer_from() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(VitaToken, ());
        let client = VitaTokenClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        let spender = Address::generate(&env);
        let recipient = Address::generate(&env);

        client.initialize(&admin);
        client.approve(&admin, &spender, &5_000_0000000, &1000);
        client.transfer_from(&spender, &admin, &recipient, &2_000_0000000);

        assert_eq!(client.balance(&recipient), 2_000_0000000);
        assert_eq!(client.allowance(&admin, &spender), 3_000_0000000);
    }

    #[test]
    #[should_panic(expected = "exceeds max supply")]
    fn test_mint_exceeds_max_supply() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(VitaToken, ());
        let client = VitaTokenClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        client.initialize(&admin);
        client.mint(&admin, &1); // supply already at max
    }
}
