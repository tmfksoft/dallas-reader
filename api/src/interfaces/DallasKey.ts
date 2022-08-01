export default interface DallasKey { 
	familyCode: number,
	serialNumber: number[],
	crc: number | null,
	fullSerial: string,
}