module blixa_print::print_session {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use std::string::String;

    // Errors
    const EAlreadyPrinted: u64 = 1;
    const ENotOwner: u64 = 2;
    const EInvalidStatus: u64 = 3;
    const EExpired: u64 = 4;
    const EInvalidToken: u64 = 5;

    // Status constants
    const STATUS_CREATED: u8 = 0;
    const STATUS_PRINTED: u8 = 1;
    const STATUS_DESTROYED: u8 = 2;
    const STATUS_EXPIRED: u8 = 3;

    // Print Session Object - stores all session data on-chain
    public struct PrintSession has key, store {
        id: UID,
        owner: address,
        document_hash: String,
        document_cid: String,        // IPFS CID for encrypted file
        filename: String,
        file_size: u64,
        session_id: String,
        one_time_token_hash: String, // Hash of the one-time token
        status: u8,
        created_at: u64,
        expires_at: u64,
        printed_at: u64,
        encryption_key_hash: String, // Hash of encryption key (actual key in QR)
    }

    // Events
    public struct SessionCreated has copy, drop {
        session_id: String,
        owner: address,
        document_hash: String,
        document_cid: String,
        filename: String,
        expires_at: u64,
    }

    public struct SessionPrinted has copy, drop {
        session_id: String,
        owner: address,
        printed_at: u64,
        agent: address,
    }

    public struct SessionDestroyed has copy, drop {
        session_id: String,
        owner: address,
        reason: String,
    }

    // Create new print session with full metadata
    public entry fun create_session(
        document_hash: String,
        document_cid: String,
        filename: String,
        file_size: u64,
        session_id: String,
        one_time_token_hash: String,
        encryption_key_hash: String,
        expires_at: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let current_time = tx_context::epoch_timestamp_ms(ctx);

        let session = PrintSession {
            id: object::new(ctx),
            owner: sender,
            document_hash,
            document_cid,
            filename,
            file_size,
            session_id,
            one_time_token_hash,
            status: STATUS_CREATED,
            created_at: current_time,
            expires_at,
            printed_at: 0,
            encryption_key_hash,
        };

        event::emit(SessionCreated {
            session_id,
            owner: sender,
            document_hash,
            document_cid,
            filename,
            expires_at,
        });

        transfer::transfer(session, sender);
    }

    // Mark session as printed (can be called by agent with token)
    public entry fun mark_printed(
        session: &mut PrintSession,
        token_hash: String,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let current_time = tx_context::epoch_timestamp_ms(ctx);
        
        // Verify token hash matches
        assert!(session.one_time_token_hash == token_hash, EInvalidToken);
        assert!(session.status == STATUS_CREATED, EAlreadyPrinted);
        assert!(current_time < session.expires_at, EExpired);

        session.status = STATUS_PRINTED;
        session.printed_at = current_time;

        event::emit(SessionPrinted {
            session_id: session.session_id,
            owner: session.owner,
            printed_at: current_time,
            agent: sender,
        });
    }

    // Destroy session (after print or expiry)
    public entry fun destroy_session(
        session: PrintSession,
        reason: String,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(session.owner == sender, ENotOwner);

        let PrintSession {
            id,
            owner: _,
            document_hash: _,
            session_id,
            status: _,
            created_at: _,
            expires_at: _,
            printed_at: _,
        } = session;

        event::emit(SessionDestroyed {
            session_id,
            owner: sender,
            reason,
        });

        object::delete(id);
    }

    // Mark as expired
    public entry fun mark_expired(
        session: &mut PrintSession,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(session.owner == sender, ENotOwner);
        assert!(session.status == STATUS_CREATED, EInvalidStatus);

        session.status = STATUS_EXPIRED;
    }

    // Getters
    public fun get_status(session: &PrintSession): u8 {
        session.status
    }

    public fun get_owner(session: &PrintSession): address {
        session.owner
    }

    public fun is_printed(session: &PrintSession): bool {
        session.status == STATUS_PRINTED
    }

    public fun get_document_cid(session: &PrintSession): String {
        session.document_cid
    }

    public fun get_session_id(session: &PrintSession): String {
        session.session_id
    }

    public fun get_filename(session: &PrintSession): String {
        session.filename
    }

    public fun verify_token(session: &PrintSession, token_hash: String): bool {
        session.one_time_token_hash == token_hash && session.status == STATUS_CREATED
    }
}
