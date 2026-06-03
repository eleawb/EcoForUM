

let apiUrl: string | null = null;

async function waitForNgrokUrl() {
  let info = await fetch('/api/server-info').then(r => r.json());

  while (!info.url) {
    console.log("En attente de l'URL ngrok...");
    await new Promise(r => setTimeout(r, 1000));
    info = await fetch('/api/server-info').then(r => r.json());
  }

  return info.url;
}

export async function apiFetch(path: string, options?: RequestInit) {
  if (!apiUrl) {
    apiUrl = await waitForNgrokUrl();
  }

  return fetch(`${apiUrl}${path}`, options);
}
