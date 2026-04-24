use anchor_lang::prelude::*;

declare_id!("ABaXxAFwdeKc82mocL2nKzd1JsVdXDKtesxArpEyqNxH");

#[program]
pub mod weza_approval {
    use super::*;

    pub fn approve_milestone(
        ctx: Context<ApproveMilestone>,
        project_id: String,
        milestone_id: String,
    ) -> Result<()> {
        require!(project_id.len() <= 64, WezaApprovalError::FieldTooLong);
        require!(milestone_id.len() <= 64, WezaApprovalError::FieldTooLong);

        let approval = &mut ctx.accounts.approval;
        approval.project_id = project_id;
        approval.milestone_id = milestone_id;
        approval.certifier_pubkey = ctx.accounts.certifier.key();
        approval.approved_at = Clock::get()?.unix_timestamp;
        approval.bump = ctx.bumps.approval;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(project_id: String, milestone_id: String)]
pub struct ApproveMilestone<'info> {
    #[account(
        init,
        payer = certifier,
        space = 8 + MilestoneApproval::INIT_SPACE,
        seeds = [b"weza", b"milestone", project_id.as_bytes(), milestone_id.as_bytes()],
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
    pub certifier_pubkey: Pubkey,
    pub approved_at: i64,
    pub bump: u8,
}

#[error_code]
pub enum WezaApprovalError {
    #[msg("WEZA approval field is too long")]
    FieldTooLong,
}
