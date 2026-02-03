<!--
  ContactBlock.svelte

  Contact information block.
  Displays headline, phone, and email for final CTA.

  Design: Alpine Noir - direct, utilitarian contact info
  From: docs/plans/2025-12-30-portal-zoom-portfolio-design.md
-->
<script lang="ts">
  import { css } from '$styled/css'

  interface Props {
    headline?: string
    phone?: string
    email?: string
  }

  let {
    headline = 'If you have a story to tell please get in touch.',
    phone = '+447880352909',
    email = 'sandro.gromen-hayes@live.com'
  }: Props = $props()

  const containerStyles = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    maxWidth: '500px',
    padding: '2rem',

    '@media (max-width: 767px)': {
      maxWidth: '100%',
      padding: '1.5rem',
    },
  })

  // Headline
  const headlineStyles = css({
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
    fontWeight: '400',
    lineHeight: '1.4',
    color: 'brand.text',
    margin: '0 0 2rem 0',
  })

  // Divider
  const dividerStyles = css({
    width: '80px',
    height: '1px',
    backgroundColor: 'brand.phantom',
    margin: '1.5rem 0',
  })

  // Contact info wrapper
  const contactInfoStyles = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  })

  // Value (actual phone/email)
  const valueStyles = css({
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 'clamp(0.85rem, 1.2vw, 1rem)',
    fontWeight: '400',
    color: 'brand.text',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
    '&:hover': {
      color: 'brand.accent',
    },
  })
</script>

<div class={containerStyles}>
  <h2 class={headlineStyles} data-animate="text" data-direction="down">{headline}</h2>

  <div class={dividerStyles}></div>

  <div class={contactInfoStyles}>
    {#if phone}
      <a href="tel:{phone}" class={valueStyles} data-animate="text" data-direction="down">{phone}</a>
    {/if}

    {#if email}
      <a href="mailto:{email}" class={valueStyles} data-animate="text" data-direction="down">{email}</a>
    {/if}
  </div>
</div>
