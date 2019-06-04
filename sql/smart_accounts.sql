drop table if exists smart_accounts;
create table  smart_accounts (
    public_key varchar(64) not null default '' comment 'Public key of the smart account, in base58',
    private_key varchar(64) not null default '' comment 'Private key of the smart account, in base58',
    seed varchar(255) not null default '' comment 'Seed that was used for generating the keys of the smart account',
    added timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    primary key(public_key)
) engine=InnoDb default charset=utf8;
