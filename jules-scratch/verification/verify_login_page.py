from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the login page
        page.goto("http://localhost:3000/login")

        # Wait for the main card to be visible to ensure the page has loaded
        expect(page.locator("h1:has-text('Welcome Back')")).to_be_visible()

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/verification.png")

        browser.close()

if __name__ == "__main__":
    run_verification()