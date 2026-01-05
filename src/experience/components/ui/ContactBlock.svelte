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
    phone = '+44 7880 352909',
    email = 'sandro@sandrogh.com'
  }: Props = $props()

  const containerStyles = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    maxWidth: '500px',
    padding: '2rem',
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

  // Contact info wrapper
  const contactInfoStyles = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  })

  // Individual contact line
  const contactLineStyles = css({
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  })

  // Label (PHONE, EMAIL)
  const labelStyles = css({
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: '0.65rem',
    fontWeight: '500',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'brand.phantom',
    minWidth: '50px',
  })

  // Value (actual phone/email)
  const valueStyles = css({
    fontFamily: "'IBM Plex Mono', 'IBM Plex Sans', monospace",
    fontSize: '0.9rem',
    fontWeight: '400',
    color: 'brand.accent',
    textDecoration: 'none',
    transition: 'opacity 0.2s ease',
    '&:hover': {
      opacity: '0.8',
    },
  })
</script>

<div class={containerStyles}>
  <h2 class={headlineStyles} data-animate="text">{headline}</h2>

  <div class={contactInfoStyles}>
    {#if phone}
      <div class={contactLineStyles} data-animate="text">
        <span class={labelStyles}>PHONE</span>
        <a href="tel:{phone.replace(/\s/g, '')}" class={valueStyles}>{phone}</a>
      </div>
    {/if}

    {#if email}
      <div class={contactLineStyles} data-animate="text">
        <span class={labelStyles}>EMAIL</span>
        <a href="mailto:{email}" class={valueStyles}>{email}</a>
      </div>
    {/if}
  </div>
</div>
