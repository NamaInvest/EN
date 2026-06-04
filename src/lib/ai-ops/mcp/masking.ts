export function maskSecrets(text: string): string {
  if (!text) return text;
  let masked = text;
  
  // Mask URLs with credentials (like postgresql://...)
  masked = masked.replace(/postgresql:\/\/([^:]+):([^@]+)@([^/]+)/gi, 'postgresql://***:***@$3');
  masked = masked.replace(/postgres:\/\/([^:]+):([^@]+)@([^/]+)/gi, 'postgres://***:***@$3');
  
  // Mask passwords/secrets in query string/env values
  masked = masked.replace(/(password|pass|passwd|secret|token|key|private_key|ssh_key|privatekey|sshkey)=([^\s&]+)/gi, '$1=***');
  
  // Mask generic private keys
  masked = masked.replace(/-----BEGIN[^-]+-----[\s\S]+?-----END[^-]+-----/g, '-----BEGIN PRIVATE KEY-----\n***\n-----END PRIVATE KEY-----');
  
  // Mask IPv4 addresses
  masked = masked.replace(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g, '***.***.***.***');
  
  return masked;
}
