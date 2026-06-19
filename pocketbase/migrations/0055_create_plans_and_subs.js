migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    if (!users.fields.getByName('is_agency')) {
      users.fields.add(new BoolField({ name: 'is_agency' }))
      app.save(users)
    }

    const plans = new Collection({
      name: 'plans',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != '' && @request.auth.is_agency = true",
      updateRule: "@request.auth.id != '' && @request.auth.is_agency = true",
      deleteRule: "@request.auth.id != '' && @request.auth.is_agency = true",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'expiration_days', type: 'number', required: true },
        { name: 'max_users', type: 'number', required: true },
        { name: 'max_messages_month', type: 'number', required: true },
        { name: 'price_monthly', type: 'number' },
        { name: 'is_active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(plans)

    const subs = new Collection({
      name: 'subscriptions',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.is_agency = true || account_id.account_members_via_account_id.user_id ?= @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && (@request.auth.is_agency = true || account_id.account_members_via_account_id.user_id ?= @request.auth.id)",
      createRule: "@request.auth.id != '' && @request.auth.is_agency = true",
      updateRule: "@request.auth.id != '' && @request.auth.is_agency = true",
      deleteRule: null,
      fields: [
        {
          name: 'account_id',
          type: 'relation',
          required: true,
          collectionId: 'accounts',
          maxSelect: 1,
        },
        { name: 'plan_id', type: 'relation', required: true, collectionId: plans.id, maxSelect: 1 },
        { name: 'start_date', type: 'date' },
        { name: 'end_date', type: 'date' },
        { name: 'message_count', type: 'number' },
        { name: 'status', type: 'select', selectValues: ['active', 'expired', 'trial'] },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(subs)

    const planRecord = new Record(plans)
    planRecord.set('name', 'Trial')
    planRecord.set('description', 'Plano de teste por 14 dias')
    planRecord.set('expiration_days', 14)
    planRecord.set('max_users', 2)
    planRecord.set('max_messages_month', 500)
    planRecord.set('price_monthly', 0)
    planRecord.set('is_active', true)
    app.save(planRecord)

    const accounts = app.findRecordsByFilter('accounts', '1=1', '', 1000, 0)
    for (let acc of accounts) {
      try {
        app.findFirstRecordByData('subscriptions', 'account_id', acc.id)
      } catch (_) {
        const subRecord = new Record(subs)
        subRecord.set('account_id', acc.id)
        subRecord.set('plan_id', planRecord.id)

        const now = new Date()
        subRecord.set('start_date', now.toISOString().replace('T', ' '))

        const end = new Date()
        end.setDate(end.getDate() + 14)
        subRecord.set('end_date', end.toISOString().replace('T', ' '))

        subRecord.set('message_count', 0)
        subRecord.set('status', 'trial')
        app.save(subRecord)
      }
    }

    try {
      const admin = app.findAuthRecordByEmail('users', 'cdalgallo@gmail.com')
      admin.set('is_agency', true)
      app.save(admin)
    } catch (e) {}
  },
  (app) => {
    const subs = app.findCollectionByNameOrId('subscriptions')
    app.delete(subs)
    const plans = app.findCollectionByNameOrId('plans')
    app.delete(plans)
  },
)
