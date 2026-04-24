use anchor_lang::prelude::*;

declare_id!("WEZAappr1111111111111111111111111111111111");

#[program]
pub mod weza_approval {
    use super::*;

    pub fn record_approval(
        ctx: Context<RecordApproval>,
        project_id: String,
        milestone_id: String,
        submission_id: String,
        file_sha256: String,
        amount_usdc: u64,
        version: u32,
    ) -> Result<()> {
        require!(project_id.len() <= 64, WezaApprovalError::FieldTooLong);
        require!(milestone_id.len() <= 64, WezaApprovalError::FieldTooLong);
        require!(submission_id.len() <= 64, WezaApprovalError::FieldTooLong);
        require!(file_sha256.len() == 64, WezaApprovalError::InvalidSha256);

        let approval = &mut ctx.accounts.approval;
        approval.project_id = project_id;
        approval.milestone_id = milestone_id;
        approval.submission_id = submission_id;
        approval.certifier = ctx.accounts.certifier.key();
        approval.file_sha256 = file_sha256;
        approval.amount_usdc = amount_usdc;
        approval.version = version;
        approval.approved_at = Clock::get()?.unix_timestamp;
        approval.bump = ctx.bumps.approval;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(project_id: String, milestone_id: String)]
pub struct RecordApproval<'info> {
    #[account(
        init,
        payer = certifier,
        space = 8 + MilestoneApproval::INIT_SPACE,
        seeds = [b"weza", b"approval", milestone_id.as_bytes()],
        bump
    )]
    pub approval: Account<'info, MilestoneApproval>,
    #[account(mut)]
    pub certifier: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct MilestoneApproval {
    #[max_len(64)]
    pub project_id: String,
    #[max_len(64)]
    pub milestone_id: String,
    #[max_len(64)]
    pub submission_id: String,
    pub certifier: Pubkey,
    #[max_len(64)]
    pub file_sha256: String,
    pub amount_usdc: u64,
    pub version: u32,
    pub approved_at: i64,
    pub bump: u8,
}

#[error_code]
pub enum WezaApprovalError {
    #[msg("WEZA approval field is too long")]
    FieldTooLong,
    #[msg("Submission file hash must be a 64-character sha256 hex string")]
    InvalidSha256,
}
