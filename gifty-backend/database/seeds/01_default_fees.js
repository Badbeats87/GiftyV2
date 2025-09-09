/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('platform_fees').del()
  await knex('platform_fees').insert([
    { fee_type: 'platform', percentage: 2.5, is_active: true, created_at: knex.fn.now(), updated_at: knex.fn.now() },
    { fee_type: 'customer', percentage: 1.0, is_active: true, created_at: knex.fn.now(), updated_at: knex.fn.now() }
  ]);
};
