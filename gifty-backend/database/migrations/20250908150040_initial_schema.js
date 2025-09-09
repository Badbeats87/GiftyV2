/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('users', function (table) {
      table.increments('id').primary();
      table.string('email', 255).unique().notNullable();
      table.string('password_hash', 255).notNullable();
      table.timestamps(true, true);
    })
    .createTable('businesses', function (table) {
      table.increments('id').primary();
      table.string('name', 255).notNullable();
      table.string('email', 255).unique().notNullable();
      table.string('password_hash', 255).notNullable();
      table.text('address').notNullable();
      table.string('contact_phone', 50);
      table.string('contact_email', 255);
      table.text('description');
      table.string('logo_url', 255);
      table.specificType('images_urls', 'TEXT[]');
      table.jsonb('operating_hours');
      table.text('terms_and_conditions');
      table.jsonb('bank_account_details');
      table.boolean('is_approved').defaultTo(false);
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('gift_cards', function (table) {
      table.increments('id').primary();
      table.integer('business_id').unsigned().notNullable().references('businesses.id').onDelete('CASCADE');
      table.string('unique_code', 255).unique().notNullable();
      table.string('qr_code_url', 255);
      table.decimal('value', 10, 2).notNullable();
      table.string('currency', 3).defaultTo('USD').notNullable();
      table.string('status', 50).defaultTo('active').notNullable();
      table.integer('purchased_by_user_id').unsigned().references('users.id').onDelete('SET NULL');
      table.timestamp('purchased_at').defaultTo(knex.fn.now());
      table.timestamp('redeemed_at');
      table.timestamp('expires_at');
      table.text('personal_message');
      table.timestamps(true, true);
    })
    .createTable('transactions', function (table) {
      table.increments('id').primary();
      table.string('type', 50).notNullable();
      table.decimal('amount', 10, 2).notNullable();
      table.string('currency', 3).defaultTo('USD').notNullable();
      table.integer('entity_id');
      table.string('entity_type', 50);
      table.integer('related_transaction_id').unsigned().references('transactions.id').onDelete('SET NULL');
      table.string('status', 50).defaultTo('completed').notNullable();
      table.text('description');
      table.timestamps(true, true);
    })
    .createTable('admin_users', function (table) {
      table.increments('id').primary();
      table.string('email', 255).unique().notNullable();
      table.string('password_hash', 255).notNullable();
      table.string('role', 50).defaultTo('admin').notNullable();
      table.timestamps(true, true);
    })
    .createTable('platform_fees', function (table) {
      table.increments('id').primary();
      table.string('fee_type', 50).unique().notNullable();
      table.decimal('percentage', 5, 2).notNullable();
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('business_fees', function (table) {
      table.increments('id').primary();
      table.integer('business_id').unsigned().notNullable().references('businesses.id').onDelete('CASCADE');
      table.string('fee_type', 50).notNullable();
      table.decimal('percentage', 5, 2).notNullable();
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
      table.unique(['business_id', 'fee_type']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('business_fees')
    .dropTableIfExists('platform_fees')
    .dropTableIfExists('admin_users')
    .dropTableIfExists('transactions')
    .dropTableIfExists('gift_cards')
    .dropTableIfExists('businesses')
    .dropTableIfExists('users');
};
