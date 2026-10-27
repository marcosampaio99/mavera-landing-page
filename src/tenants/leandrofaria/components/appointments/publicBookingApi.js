// Public reads only. Configuration comes from the same tenant-bound SDK client.
export function publicBookingApi(config, fetcher = globalThis.fetch) {
  const base = config.apiBaseUrl.replace(/\/+$/, '');
  const root = `${base.endsWith('/api/v1') ? base : `${base}/api/v1`}/public/${encodeURIComponent(config.tenantSlug)}`;
  if (!config.tenantSlug) throw new Error('Missing tenant slug');
  async function get(path, params, signal) {
    const query = new URLSearchParams(Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== '').map(([key, value]) => [key, String(value)]));
    const response = await fetcher(`${root}/${path}${query.size ? `?${query}` : ''}`, {
      method: 'GET', signal, headers: { Accept: 'application/json' }, credentials: 'omit', redirect: 'error', cache: 'no-store',
    });
    if (!response.ok) throw new Error('Public booking read failed');
    return response.json();
  }
  return {
    locations: signal => get('locations', {}, signal),
    resources: (params, signal) => get('resources', params, signal),
    availability: (params, signal) => get('availability', params, signal),
  };
}
