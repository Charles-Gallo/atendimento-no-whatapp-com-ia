routerAdd(
  'DELETE',
  '/backend/v1/accounts-cascade/{id}',
  (e) => {
    const id = e.request.pathValue('id')
    if (!e.auth || !e.auth.getBool('is_agency')) {
      return e.forbiddenError('Apenas agências podem excluir contas')
    }

    $app.runInTransaction((txApp) => {
      const collectionsWithAccountId = [
        'mark_read_queue',
        'whatsapp_messages',
        'tasks',
        'crm_contacts',
        'crm_companies',
        'conversations',
        'whatsapp_instances',
        'ai_agents',
        'account_members',
        'account_invites',
        'categories',
        'crm_stages',
        'subscriptions',
      ]

      for (const col of collectionsWithAccountId) {
        while (true) {
          let records = []
          try {
            records = txApp.findRecordsByFilter(col, `account_id = '${id}'`, '', 1000, 0)
          } catch (err) {
            // collection might not exist or no records found
            break
          }
          if (!records || records.length === 0) break

          for (const record of records) {
            txApp.delete(record)
          }
        }
      }

      try {
        const account = txApp.findRecordById('accounts', id)
        txApp.delete(account)
      } catch (err) {
        // already deleted or doesn't exist
      }
    })

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
