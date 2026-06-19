migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.listRule = 'id = @request.auth.id || @request.auth.is_agency = true'
    users.viewRule = 'id = @request.auth.id || @request.auth.is_agency = true'
    app.save(users)

    const accounts = app.findCollectionByNameOrId('accounts')
    accounts.listRule =
      "@request.auth.id != '' && (@request.auth.is_agency = true || account_members_via_account_id.user_id ?= @request.auth.id)"
    accounts.viewRule =
      "@request.auth.id != '' && (@request.auth.is_agency = true || account_members_via_account_id.user_id ?= @request.auth.id)"
    app.save(accounts)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.listRule = 'id = @request.auth.id'
    users.viewRule = 'id = @request.auth.id'
    app.save(users)

    const accounts = app.findCollectionByNameOrId('accounts')
    accounts.listRule =
      "@request.auth.id != '' && account_members_via_account_id.user_id ?= @request.auth.id"
    accounts.viewRule =
      "@request.auth.id != '' && account_members_via_account_id.user_id ?= @request.auth.id"
    app.save(accounts)
  },
)
