// tests/e2e/inspection-flow.spec.ts
import { test, expect, Page } from '@playwright/test'

test.describe('Inspection Flow', () => {
  let page: Page

  test.beforeEach(async ({ page: p }) => {
    page = p
    
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'demo@amazon.at')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button[type="submit"]')
    
    // Wait for navigation to dashboard
    await page.waitForURL('/dashboard')
  })

  test('complete inspection from start to finish', async () => {
    // Navigate to create inspection
    await page.click('a[href="/inspections/create"]')
    await page.waitForURL('/inspections/create')

    // Select location
    await page.click('[data-location="DVI1"]')
    expect(await page.locator('[data-location="DVI1"]').getAttribute('class')).toContain('active')

    // Wait for templates to load
    await page.waitForSelector('.template-card')

    // Select first template
    await page.click('.template-card:first-child')
    expect(await page.locator('.template-card:first-child').getAttribute('class')).toContain('active')

    // Add optional information
    await page.fill('input[placeholder*="Inspektionsname"]', 'E2E Test Inspection')
    await page.fill('textarea', 'This is an automated test inspection')
    
    // Enable voice input
    await page.check('input[type="checkbox"]')

    // Start inspection
    await page.click('button:has-text("Inspektion starten")')
    
    // Wait for navigation to execution view
    await page.waitForURL(/\/inspections\/.*\/execute/)

    // Answer first question
    await page.waitForSelector('.question-card')
    await page.click('.option-card:has-text("Ja")')
    
    // Add a note
    await page.click('button:has-text("Notiz")')
    await page.waitForSelector('.modal-backdrop')
    await page.fill('.note-textarea', 'Test note from E2E')
    await page.click('button:has-text("Speichern")')

    // Navigate to next section
    await page.click('button:has-text("Weiter")')
    
    // Answer more questions
    await page.waitForSelector('.question-card')
    await page.click('.option-card:has-text("Ja")')

    // Complete inspection
    await page.click('button:has-text("Abschließen")')
    
    // Should redirect to inspection detail
    await page.waitForURL(/\/inspections\/[^\/]+$/)
    
    // Verify completion
    expect(await page.locator('.status-badge').textContent()).toContain('Abgeschlossen')
    expect(await page.locator('.progress-fill-large').getAttribute('style')).toContain('width: 100%')
  })

  test('save and resume inspection', async () => {
    // Create inspection
    await page.goto('/inspections/create')
    await page.click('[data-location="DVI2"]')
    await page.click('.template-card:first-child')
    await page.click('button:has-text("Inspektion starten")')
    
    // Answer one question
    await page.waitForSelector('.question-card')
    await page.click('.option-card:first-child')
    
    // Save progress
    await page.click('button:has-text("Speichern")')
    await page.waitForTimeout(1000) // Wait for save

    // Go back to inspections list
    await page.goto('/inspections')
    
    // Find and click on in-progress inspection
    await page.click('.inspection-card:has-text("In Bearbeitung")')
    
    // Resume inspection
    await page.click('button:has-text("Bearbeiten")')
    
    // Verify previous answer is saved
    expect(await page.locator('.option-card.selected').count()).toBeGreaterThan(0)
  })

  test('export inspection as PDF', async () => {
    // Navigate to completed inspection
    await page.goto('/inspections')
    await page.click('.inspection-card:has-text("Abgeschlossen"):first-child')
    
    // Start PDF export
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("PDF Export")')
    
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('WHS-Inspektion')
    expect(download.suggestedFilename()).toEndWith('.pdf')
  })

  test('mobile navigation works correctly', async ({ browser }) => {
    // Create mobile context
    const context = await browser.newContext({
      ...devices['iPhone 12']
    })
    const mobilePage = await context.newPage()
    
    // Login
    await mobilePage.goto('/login')
    await mobilePage.fill('input[type="email"]', 'demo@amazon.at')
    await mobilePage.fill('input[type="password"]', 'demo123')
    await mobilePage.click('button[type="submit"]')
    
    // Check mobile navigation
    await mobilePage.waitForSelector('.mobile-nav')
    
    // Navigate using mobile nav
    await mobilePage.click('.mobile-nav a[href="/inspections"]')
    await mobilePage.waitForURL('/inspections')
    
    // Create new inspection via mobile nav
    await mobilePage.click('.mobile-nav a[href="/inspections/create"]')
    await mobilePage.waitForURL('/inspections/create')
    
    await context.close()
  })

  test('offline functionality', async ({ context }) => {
    // Navigate to inspection execution
    await page.goto('/inspections/create')
    await page.click('[data-location="DAP5"]')
    await page.click('.template-card:first-child')
    await page.click('button:has-text("Inspektion starten")')
    
    // Go offline
    await context.setOffline(true)
    
    // Try to answer questions offline
    await page.click('.option-card:first-child')
    await page.click('button:has-text("Weiter")')
    
    // Should still work offline
    expect(await page.locator('.question-card').count()).toBeGreaterThan(0)
    
    // Go back online
    await context.setOffline(false)
    
    // Save should sync
    await page.click('button:has-text("Speichern")')
    await page.waitForTimeout(1000)
  })

  test('search and filter inspections', async () => {
    await page.goto('/inspections')
    
    // Search by name
    await page.fill('input[placeholder="Suchen..."]', 'Sicherheit')
    await page.waitForTimeout(500) // Debounce
    
    // Filter by location
    await page.selectOption('select:has-text("Alle Standorte")', 'DVI1')
    
    // Filter by status
    await page.selectOption('select:has-text("Alle Status")', 'completed')
    
    // Verify filters are applied
    const cards = await page.locator('.inspection-card').count()
    expect(cards).toBeGreaterThan(0)
    
    // Clear filters
    await page.click('button:has-text("Alle löschen")')
    
    // Should show all inspections again
    const allCards = await page.locator('.inspection-card').count()
    expect(allCards).toBeGreaterThan(cards)
  })

  test('collaboration features', async ({ browser }) => {
    // Create second browser context for second user
    const context2 = await browser.newContext()
    const page2 = await context2.newPage()
    
    // Login as second user
    await page2.goto('/login')
    await page2.fill('input[type="email"]', 'demo2@amazon.at')
    await page2.fill('input[type="password"]', 'demo123')
    await page2.click('button[type="submit"]')
    
    // First user creates inspection
    await page.goto('/inspections/create')
    await page.click('[data-location="DVI1"]')
    await page.click('.template-card:first-child')
    await page.click('button:has-text("Inspektion starten")')
    
    // Get inspection URL
    const inspectionUrl = page.url()
    
    // Second user navigates to same inspection
    await page2.goto(inspectionUrl)
    
    // Should see collaboration indicator
    await page.waitForSelector('.collaborators')
    await page2.waitForSelector('.collaborators')
    
    await context2.close()
  })
})
