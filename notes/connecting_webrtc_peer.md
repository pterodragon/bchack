## Introduction

To support connections between NAT'ed peers, WebRTC uses a protocol called Interactive Connectivity Establishment(ICE) for establishing connection instead of the classic listen/connect mechanism.

As it assumes two peers are not directly communicable, the connection is triggered via a third-party public-accessible program (a.k.a. signaling server), by forwarding to both peers the other's connectable endpoints (which could be hole-punched by a STUN, or proxied through a TUN) and the lists of service available (a.k.a. Session Description).

The implementation of the signaling server is not defined in the WebRTC spec, and is up to developers' implementation. It could even be copied & pasted, but for dynamic connection a public server is oftenly used.


## Decentralizing the signaling process

The main challenge in bringing up the WebRTC connection is that both peers have to establish the connection (according to their Session Description), as opposed to the classic listen/connect that only one has to establish the connection while the another is only waiting.

Possible solutions are:
 - Decentralizing the signaling server. i.e. The signaling servers forms a DHT network, and the signaling will be propagated via the DHT until reaching the signal server that the another peer connected. Another benefit of this is that a signal server accessible by both peers is not needed.

### References:
[1]: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Connectivity
[2]: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Session_lifetime
