from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # 1. Unauthenticated access to private route
    print("Checking unauthenticated access to private route...")
    page.goto("http://localhost:3000/dashboard")
    expect(page).to_have_url("http://localhost:3000/login")
    page.screenshot(path="jules-scratch/verification/unauthenticated_redirect.png")
    print("...redirected to /login as expected.")

    # 2. Authenticated access to public route
    print("Checking authenticated access to public route...")
    page.goto("http://localhost:3000/login")

    # Use dummy credentials. The backend might not be running, but the form submission will trigger navigation.
    page.locator("#email").fill("test@example.com")
    page.locator("#password").fill("password123")
    page.get_by_role("button", name="Sign In").click()

    # Wait for navigation to dashboard
    expect(page).to_have_url("http://localhost:3000/dashboard", timeout=10000)
    print("...login successful, redirected to /dashboard.")

    # Try to access a public route
    page.goto("http://localhost:3000/login")
    expect(page).to_have_url("http://localhost:3000/dashboard")
    page.screenshot(path="jules-scratch/verification/authenticated_redirect.png")
    print("...redirected to /dashboard from /login as expected.")

    # 3. Authenticated access to another private route
    print("Checking authenticated access to another private route...")
    page.goto("http://localhost:3000/profile")
    expect(page).to_have_url("http://localhost:3000/profile")
    page.screenshot(path="jules-scratch/verification/authenticated_profile_access.png")
    print("...successfully accessed /profile.")


    browser.close()

with sync_playwright() as playwright:
    run(playwright)