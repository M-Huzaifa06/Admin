const rawBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || 'https://backend-production-cfeb.up.railway.app/api';
const API_BASE = rawBase.replace(/\/$/, '');

console.log('API_BASE configured as:', API_BASE);

async function request(path, options = {}) {
  const cleanPath = path.replace(/^\//, '');
  const fullUrl = `${API_BASE}/${cleanPath}`;
  console.log('Request:', options.method || 'GET', fullUrl);

  const res = await fetch(fullUrl, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  console.log('Response status:', res.status, res.statusText);

  const contentType = res.headers.get('content-type') || '';
  let data;

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
      console.log('JSON parsed:', data);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Unable to parse JSON response', { cause: parseError });
    }
  } else {
    const text = await res.text();
    console.error('Non-JSON response:', res.status, text);
    throw new Error(`Request failed ${res.status} ${res.statusText}: ${text}`);
  }

  if (!res.ok) {
    console.error('Response not ok:', data);
    throw new Error(data?.error || `API request failed: ${res.status} ${res.statusText}`);
  }

  if (data.success === false) {
    console.error('Success flag false:', data);
    throw new Error(data.error || 'API returned error');
  }

  return data.data;
}

export async function getItems(path) {
  return request(path);
}

export async function createItem(path, body) {
  return request(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateItem(path, body) {
  return request(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function patchItem(path, body) {
  return request(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteItem(path) {
  return request(path, {
    method: 'DELETE',
  });
}
