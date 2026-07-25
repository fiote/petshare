export function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`${name} não configurado. Defina essa variável de ambiente antes de iniciar a aplicação.`);
	}
	return value;
}
