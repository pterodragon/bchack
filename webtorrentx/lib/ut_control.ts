import {Wire} from 'bittorrent-protocol';
import {WebTorrent} from 'webtorrent';

/**
 * Ideally this is a singleton to control the choking status of all connections
 * By default it choke all peer unless allow() is called
 */
export interface ut_control extends WebTorrent {
  /**
   * Signal an event when a peer is connected
   * Assuming the peer wallet address is negotiated in handshake
   * @param event 
   * @param listener 
   */
  on(event: 'established', listener: (wire: Wire) => void): this;

  on(event: 'disconnected', listener: (wire: Wire) => void): this;

  /**
   * Triggered when the remote peer has pieces that I am interested.
   * Could be used to trigger transaction
   * @param event 
   * @param listener 
   * 
   * @callback listener
   * @param wire
   * @param pieces The ids of pieces available
   */
  on(event: 'peer-interested', listener: (wire: Wire, pieces: number[]) => void): this;

  /**
   * Triggered when the remote peer becomes uninteresting.
   * The accountant should check if there are any remaining balance.
   * @param event 
   * @param listener 
   */
  on(event: 'peer-uninterested', listener: (wire: Wire) => void): this;

  /**
   * Triggered when some pieces finished downloading
   * Letting the accountant knows the progress
   *
   * Note that a piece has multiple chunks, so that the same piece number may
   * trigger the event handler multiple times
   * @param event 
   * @param listener 
   * 
   * @callback listener
   * @param wire
   * @param pieces    The pieces finished downloading (or just one piece?)
   * 
   */
  on(event: 'pieces-downloaded', listener: (wire: Wire, pieces: number[]) => void): this;

  /**
   * Triggered when some pieces finished uploading
   * Letting the accountant knows the progress
   * @param event 
   * @param listener 
   */
  on(event: 'pieces-uploaded', listener: (wire: Wire, pieces: number[]) => void): this;

  /**
   * When a transaction is completed, call this function to unchoke the peer
   * @param torrent
   * @param wire 
   * @param piece_count The number of pieces allowed to be downloaded
   */ allow(wire: Wire, piece_count: number): void;
}
