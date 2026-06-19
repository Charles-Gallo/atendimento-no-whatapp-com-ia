migrate(
  (app) => {
    // Identifica e deleta instâncias duplicadas (mantém a principal de cada account/user)
    const instances = app.findRecordsByFilter('whatsapp_instances', '', '-updated', 0, 0)

    const grouped = {}
    for (const record of instances) {
      const key = record.getString('account_id') || record.getString('user_id')
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(record)
    }

    for (const key in grouped) {
      const list = grouped[key]
      if (list.length <= 1) continue

      // Ordena priorizando status 'connected', depois as mais recentes
      list.sort((a, b) => {
        const aStatus = a.getString('status')
        const bStatus = b.getString('status')
        if (aStatus === 'connected' && bStatus !== 'connected') return -1
        if (bStatus === 'connected' && aStatus !== 'connected') return 1

        const aUpdated = a.getString('updated')
        const bUpdated = b.getString('updated')
        return bUpdated.localeCompare(aUpdated)
      })

      // Mantém a melhor instância (índice 0), deleta as excedentes
      for (let i = 1; i < list.length; i++) {
        app.delete(list[i])
      }
    }
  },
  (app) => {
    // Não há como restaurar as instâncias duplicadas removidas
  },
)
