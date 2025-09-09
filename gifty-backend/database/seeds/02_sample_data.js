/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('gift_cards').del();
  await knex('businesses').del();
  await knex('users').del();

  // Insert sample users
  const userIds = await knex('users').insert([
    { email: 'user1@example.com', password_hash: '$2a$10$somehashedpassword1', created_at: knex.fn.now(), updated_at: knex.fn.now() },
    { email: 'user2@example.com', password_hash: '$2a$10$somehashedpassword2', created_at: knex.fn.now(), updated_at: knex.fn.now() },
  ]).returning('id');
  const userId1 = userIds[0].id;
  const userId2 = userIds[1].id;

  // Insert sample businesses
  const businessIds = await knex('businesses').insert([
    {
      name: 'The Grand Restaurant',
      email: 'grand@example.com',
      password_hash: '$2a$10$somehashedpassword3',
      address: '123 Main St, Berlin',
      contact_phone: '111-222-3333',
      contact_email: 'contact@grand.com',
      description: 'A fine dining experience.',
      logo_url: 'https://via.placeholder.com/150/FF5733/FFFFFF?text=Grand',
      images_urls: ['https://via.placeholder.com/400x200/FF5733/FFFFFF?text=Restaurant1'],
      operating_hours: { mon: '9-5', tue: '9-5' },
      terms_and_conditions: 'Gift cards expire in 1 year. No partial redemption.',
      bank_account_details: { account: '12345', routing: '67890' },
      is_approved: true,
      is_active: true,
      stripe_account_id: 'acct_12345', // Placeholder
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      name: 'Cozy Corner Cafe',
      email: 'cozy@example.com',
      password_hash: '$2a$10$somehashedpassword4',
      address: '456 Oak Ave, Berlin',
      contact_phone: '444-555-6666',
      contact_email: 'contact@cozy.com',
      description: 'Your daily dose of coffee and comfort.',
      logo_url: 'https://via.placeholder.com/150/33FF57/FFFFFF?text=Cozy',
      images_urls: ['https://via.placeholder.com/400x200/33FF57/FFFFFF?text=Cafe1'],
      operating_hours: { mon: '8-6', tue: '8-6' },
      terms_and_conditions: 'Valid for all menu items. No cash value.',
      bank_account_details: { account: '67890', routing: '12345' },
      is_approved: true,
      is_active: true,
      stripe_account_id: 'acct_67890', // Placeholder
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }
  ]).returning('id');
  const businessId1 = businessIds[0].id;
  const businessId2 = businessIds[1].id;

  // Insert sample gift cards
  await knex('gift_cards').insert([
    {
      business_id: businessId1,
      unique_code: 'GC10001',
      value: 25.00,
      currency: 'USD',
      status: 'active',
      expires_at: knex.raw("NOW() + INTERVAL '1 year'"),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      business_id: businessId1,
      unique_code: 'GC10002',
      value: 50.00,
      currency: 'USD',
      status: 'active',
      expires_at: knex.raw("NOW() + INTERVAL '1 year'"),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      business_id: businessId2,
      unique_code: 'GC20001',
      value: 10.00,
      currency: 'USD',
      status: 'active',
      expires_at: knex.raw("NOW() + INTERVAL '6 months'"),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      business_id: businessId2,
      unique_code: 'GC20002',
      value: 20.00,
      currency: 'USD',
      status: 'active',
      expires_at: knex.raw("NOW() + INTERVAL '6 months'"),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }
  ]);
};
