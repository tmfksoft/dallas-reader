export default interface WSPacket {
	type: 'ping' | 'hello' | 'reauth' | 'request' | 'sub' | 'unsub' | 'message' | 'update' | 'pub' | 'revoke',
}