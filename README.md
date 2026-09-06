# Burnrate — AI API Cost Tracker

A lightweight tool that tracks how much you're actually spending across Claude, OpenAI, and Groq — before the bill surprises you.

## The problem

Mid-project, I checked my Claude API usage and found I'd spent way more than expected, with zero warning. There was no simple way to see spend across multiple AI providers in one place.

## What it does

- Generate a Burnrate API key
- Add one line to your code after each API call
- See cumulative spend by provider and model on a live dashboard

## A key technical decision

The original design used Anthropic's Admin API for org-wide usage reports. After building it, I discovered this endpoint requires a Team/Enterprise Anthropic plan — meaning it would never work for the actual target users (solo developers on free/Pro plans).

Instead of assuming a workaround, I redesigned the architecture around a **push-based logging model**: instead of asking providers for usage reports, the app receives usage data directly from the user's own code after each API call. This works regardless of account tier, for any provider.

## Tech stack

- Next.js
- Supabase (Auth + Postgres)
- Vercel (deployment)

## Architecture

1. User signs up, generates a unique Burnrate API key
2. Their app calls log_usage(provider, model, input_tokens, output_tokens) after each real API call
3. Burnrate calculates cost using current provider pricing and stores it
4. Dashboard shows cumulative spend, broken down by provider and model

## Limitations / what's next

- Pricing table currently covers common Claude, OpenAI, and Groq models — needs expansion
- No real-time alerts yet (planned: notify when spend crosses a threshold)
- No official SDK yet — integration currently requires manually calling a logging function
