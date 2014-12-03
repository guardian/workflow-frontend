var ptor    = protractor.getInstance();

describe('stub creation', function() {

    var random =            Math.round(Math.random() * 1000000);
    var stubTitle =         ('Auto Test: ' + random);

    // Locators
    var stub =              by.cssContainingText('a', stubTitle);
    var saveStubButton =    by.partialButtonText('Save stub');
    var newStubButton =     by.partialButtonText('New'); // or by css with content-list__button--new ng-scope
    var stubTitleField =    by.id("stub_title");


    it('should create a new stub', function() {
        // Not sure why we need this but it doesn't work without
        browser.ignoreSynchronization = true;

        browser.driver.sleep(3000);

        element(newStubButton).click();
        element(stubTitleField).sendKeys(stubTitle);
        element(saveStubButton).click();
        browser.driver.sleep(3000);
        expect(ptor.isElementPresent(stub)).toBeTruthy();
  });
});


