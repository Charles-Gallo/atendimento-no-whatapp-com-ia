migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('subscriptions')
    col.fields.add(
      new SelectField({
        name: 'status',
        values: ['active', 'expired', 'trial', 'paused', 'inactive'],
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('subscriptions')
    col.fields.add(
      new SelectField({
        name: 'status',
        values: ['active', 'expired', 'trial'],
      }),
    )
    app.save(col)
  },
)
