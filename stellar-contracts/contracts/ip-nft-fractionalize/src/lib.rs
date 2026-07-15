#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    token, Address, Env, String, Symbol, Vec,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    IpNftAddress,
    VaultCount,
    Vault(u64),
    FractionBalance(u64, Address),
    VaultTokenAddress(u64),
    TokenVault(Address),
    TokenDecimals(u32),
    TokenName,
    TokenSymbol,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Vault {
    pub id: u64,
    pub token_id: u64,
    pub original_owner: Address,
    pub total_fractions: i128,
    pub sale_price: i128,
    pub for_sale: bool,
    pub redeemed: bool,
}

fn emit_fractionalized(env: &Env, vault_id: u64, token_id: u64, owner: &Address, total: i128) {
    let topics = (Symbol::new(env, "fractionalized"), vault_id, token_id, owner.clone());
    env.events().publish(topics, total);
}

fn emit_buyout_initiated(env: &Env, vault_id: u64, price: i128) {
    let topics = (Symbol::new(env, "buyout_initiated"), vault_id);
    env.events().publish(topics, price);
}

fn emit_redeemed(env: &Env, vault_id: u64, buyer: &Address) {
    let topics = (Symbol::new(env, "redeemed"), vault_id, buyer.clone());
    env.events().publish(topics, ());
}

fn get_vault(env: &Env, vault_id: u64) -> Vault {
    env.storage().persistent().get(&DataKey::Vault(vault_id)).expect("vault not found")
}

fn save_vault(env: &Env, vault: &Vault) {
    env.storage().persistent().set(&DataKey::Vault(vault.id), vault);
}

fn get_balance_of(env: &Env, vault_id: u64, account: &Address) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::FractionBalance(vault_id, account.clone()))
        .unwrap_or(0)
}

fn set_balance_of(env: &Env, vault_id: u64, account: &Address, amount: i128) {
    env.storage().persistent().set(&DataKey::FractionBalance(vault_id, account.clone()), &amount);
}

#[contract]
pub struct IpNftFractionalize;

#[contractimpl]
impl IpNftFractionalize {
    pub fn initialize(env: Env, admin: Address, ipnft_address: Address) {
        if env.storage().persistent().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().persistent().set(&DataKey::Admin, &admin);
        env.storage().persistent().set(&DataKey::IpNftAddress, &ipnft_address);
        env.storage().persistent().set(&DataKey::VaultCount, &0u64);
    }

    pub fn fractionalize(env: Env, caller: Address, token_id: u64, total_fractions: i128) -> u64 {
        caller.require_auth();
        assert!(total_fractions > 0, "fractions must be positive");

        let mut count: u64 = env.storage().persistent().get(&DataKey::VaultCount).unwrap_or(0);
        let vault_id = count;
        count += 1;
        env.storage().persistent().set(&DataKey::VaultCount, &count);

        let vault = Vault {
            id: vault_id,
            token_id,
            original_owner: caller.clone(),
            total_fractions,
            sale_price: 0,
            for_sale: false,
            redeemed: false,
        };
        save_vault(&env, &vault);
        set_balance_of(&env, vault_id, &caller, total_fractions);

        emit_fractionalized(&env, vault_id, token_id, &caller, total_fractions);
        vault_id
    }

    pub fn set_buyout_price(env: Env, caller: Address, vault_id: u64, price: i128) {
        caller.require_auth();
        let vault = get_vault(&env, vault_id);
        assert!(vault.original_owner == caller, "not vault owner");
        assert!(!vault.redeemed, "already redeemed");

        let mut updated = vault;
        updated.sale_price = price;
        updated.for_sale = price > 0;
        save_vault(&env, &updated);

        emit_buyout_initiated(&env, vault_id, price);
    }

    pub fn buyout(env: Env, buyer: Address, vault_id: u64) {
        buyer.require_auth();
        let vault = get_vault(&env, vault_id);
        assert!(vault.for_sale, "not for sale");
        assert!(!vault.redeemed, "already redeemed");

        let mut updated = vault;
        updated.redeemed = true;
        updated.for_sale = false;
        save_vault(&env, &updated);

        emit_redeemed(&env, vault_id, &buyer);
    }

    pub fn vault(env: Env, vault_id: u64) -> Vault {
        get_vault(&env, vault_id)
    }

    pub fn vault_count(env: Env) -> u64 {
        env.storage().persistent().get(&DataKey::VaultCount).unwrap_or(0)
    }

    pub fn balance_of(env: Env, vault_id: u64, account: Address) -> i128 {
        get_balance_of(&env, vault_id, &account)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn test_fractionalize() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(IpNftFractionalize, ());
        let client = IpNftFractionalizeClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let owner = Address::generate(&env);
        let ipnft_addr = Address::generate(&env);

        client.initialize(&admin, &ipnft_addr);
        let vid = client.fractionalize(&owner, &0u64, &1000_0000000i128);
        assert_eq!(vid, 0);
        assert_eq!(client.balance_of(&vid, &owner), 1000_0000000i128);
    }
}
