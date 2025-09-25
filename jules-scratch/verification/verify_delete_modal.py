from playwright.sync_api import sync_playwright, expect
import time

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # Create a new project first
            page.goto("http://localhost:5000/#/setup", timeout=60000)
            page.wait_for_url("**/#/setup", timeout=10000)

            # Wait for the initial animation to complete
            page.wait_for_selector("text=الخطوة 1: الفكرة الأساسية", timeout=10000)

            # Step 1: Fill in core info
            page.get_by_label("عنوان المانغا").fill("Project to be Deleted")
            page.get_by_label("فكرة القصة الرئيسية (Logline)").fill("This is a test project that will be deleted.")
            page.get_by_role("button", name="الخطوة التالية").click()

            # Step 2: Skip world building for now
            page.wait_for_selector("text=الخطوة 2: بناء العالم بمساعدة الذكاء الاصطناعي", timeout=10000)
            page.get_by_role("button", name="الخطوة التالية").click()

            # Step 3: Generate the project
            page.wait_for_selector("text=الخطوة 3: جاهز للإنطلاق!", timeout=10000)
            page.get_by_role("button", name="أنشئ المشروع وولّد الصفحة الأولى").click()

            # Wait for navigation to the editor page, which indicates project creation is complete
            page.wait_for_url("**/project/**/page/1", timeout=60000)

            # Now, navigate to the dashboard
            page.goto("http://localhost:5000/#/dashboard", timeout=60000)
            page.wait_for_url("**/#/dashboard", timeout=10000)

            # Wait for projects to load
            expect(page.locator("text=Project to be Deleted")).to_be_visible(timeout=10000)

            # Find the project card and click the delete button
            project_cards = page.locator("div.grid > *")
            count = project_cards.count()

            delete_button_found = False
            for i in range(count):
                card = project_cards.nth(i)
                # Using a more robust check for the title within the card
                if card.locator("h3:has-text('Project to be Deleted')").count() > 0:
                    delete_button = card.locator('button:has(svg.lucide-trash-2)')
                    expect(delete_button).to_be_visible()
                    delete_button.click()
                    delete_button_found = True
                    break

            if not delete_button_found:
                raise Exception("Could not find the project card or its delete button.")

            # Verify the modal is open
            modal_title = page.locator("h3:text-is('تأكيد الحذف')")
            expect(modal_title).to_be_visible()

            modal_description = page.locator('p:has-text("هل أنت متأكد من رغبتك في حذف مشروع")')
            expect(modal_description).to_be_visible()
            expect(modal_description).to_contain_text("Project to be Deleted")

            # Take screenshot
            page.screenshot(path="jules-scratch/verification/delete_modal_verification.png")
            print("Verification script ran successfully. Screenshot captured.")

        except Exception as e:
            print(f"An error occurred: {e}")
            page.screenshot(path="jules-scratch/verification/error_screenshot.png")

        finally:
            browser.close()

if __name__ == "__main__":
    run_verification()