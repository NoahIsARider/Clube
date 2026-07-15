export function exportRowsToCsv(rows: Array<Record<string, string | number>>): string {
  if (rows.length === 0) {
    return ''
  }

  const headers = Object.keys(rows[0])
  const values = rows.map((row) =>
    headers
      .map((header) => {
        const value = String(row[header] ?? '')
        return value.includes(',') ? `"${value.replaceAll('"', '""')}"` : value
      })
      .join(','),
  )

  return [headers.join(','), ...values].join('\n')
}
