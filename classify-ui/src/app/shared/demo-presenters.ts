const fractionDigitsValue = 1;
const bytesPerMegabyte = 1024 * 1024; // eslint-disable-line @typescript-eslint/no-magic-numbers -- byte conversion
const bytesPerKilobyte = 1024;  

/** Formats a byte size as KB/MB label with the Swiss decimal comma. */
export function fileSizeValue(bytes: number | null): string {
	if (bytes === null) {
		return '';
	}
	if (bytes >= bytesPerMegabyte) {
		return `${(bytes / bytesPerMegabyte).toFixed(fractionDigitsValue).replace('.', ',')} MB`;
	}
	return `${Math.max(1, Math.round(bytes / bytesPerKilobyte))} KB`;
}
