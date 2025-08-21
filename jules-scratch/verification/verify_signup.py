from playwright.sync_api import sync_playwright, Page, expect
import re
import time

def run_signup_test(page: Page):
    """
    This function contains the logic to test the signup flow.
    """
    # 1. Go to the registration page.
    page.goto("http://localhost:3000/register")

    # 2. Check for correct page elements.
    expect(page.get_by_role("heading", name="Create an account")).to_be_visible()

    # 3. Fill in the signup form.
    timestamp = int(time.time())
    unique_email = f"user_{timestamp}@example.com"

    page.get_by_label("First Name").fill("Test")
    page.get_by_label("Last Name").fill("User")
    page.get_by_label("Email Address").fill(unique_email)
    page.get_by_label("Password").fill("Password123!")

    # 4. Click the "Create Account" button.
    page.get_by_role("button", name="Create Account").click()

    # 5. Check for successful navigation to the dashboard.
    expect(page).to_have_url(re.compile(".*dashboard"), timeout=20000)

    # The dashboard should have a specific heading, let's assume "Dashboard" or similar.
    # Let's look for a heading that contains the user's name or a welcome message.
    # Based on the login page, let's assume the main content area has a specific role.
    # For now, let's just check for a common element like a main heading.
    # The login page redirects to "/dashboard". Let's check for a known element on the dashboard.
    # From previous exploration of the backend, the user has portfolios.
    # A dashboard would likely show this.
    expect(page.get_by_role("heading", name="Portfolios")).to_be_visible()

    # 6. Screenshot the result.
    page.screenshot(path="jules-scratch/verification/signup_dashboard.png")
    print("Screenshot saved to jules-scratch/verification/signup_dashboard.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            run_signup_test(page)
            print("Verification script ran successfully.")
        except Exception as e:
            print(f"An error occurred: {e}")
            # Take a screenshot on error for debugging
            page.screenshot(path="jules-scratch/verification/error_screenshot.png")
            print("Error screenshot saved to jules-scratch/verification/error_screenshot.png")
            raise
        finally:
            browser.close()

if __name__ == "__main__":
    main()
