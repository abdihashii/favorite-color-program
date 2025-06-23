use anchor_lang::prelude::*;

declare_id!("AMt9tGcfKDkFEVQKAHjLc6Tcs9eSPfwziinE7nFZtAMv");

#[program]
pub mod favorite_color_program {
    use super::*;

    // Think of this as a TypeScript class method that initializes storage
    pub fn initialize(ctx: Context<Initialize>, color: String) -> Result<()> {
        // Validate the color input (input validation in TypeScript)
        if color.len() > 50 {
            return Err(ErrorCode::ColorTooLong.into());
        }

        let user_color = &mut ctx.accounts.user_color;
        user_color.user = ctx.accounts.user.key();
        user_color.color = color;

        msg!("User's favorite color set to: {}", user_color.color);
        Ok(())
    }

    // Think of this as an update method in the TypeScript class
    pub fn update_color(ctx: Context<UpdateColor>, new_color: String) -> Result<()> {
        if new_color.len() > 50 {
            return Err(ErrorCode::ColorTooLong.into());
        }

        let user_color = &mut ctx.accounts.user_color;
        user_color.color = new_color;

        msg!("User's favorite color updated to: {}", user_color.color);
        Ok(())
    }
}

// This is like defining the parameters/context for your function calls
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 4 + 50,
        seeds = [b"user-color", user.key().as_ref()],
        bump,
    )]
    pub user_color: Account<'info, UserColor>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateColor<'info> {
    #[account(
        mut,
        seeds = [b"user-color", user.key().as_ref()],
        bump,
    )]
    pub user_color: Account<'info, UserColor>,

    #[account(mut)]
    pub user: Signer<'info>,
}

// This is like defining a TypeScript interface for your data
#[account]
pub struct UserColor {
    pub user: Pubkey,
    pub color: String,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Color is too long")]
    ColorTooLong,
}
