var ptor    = protractor.getInstance();

describe('stub creation', function() {

    var random =            Math.round(Math.random() * 1000000),
        stubTitle =         ('Auto Test: ' + random);

    // Locators
    var CreateNewButton =   by.css('.wf-icon-type--arrow-down'),
        createArticle =     by.cssContainingText('span', 'Article'),
        stubTitleField =    by.id("stub_title"),
        saveStubButton =    by.buttonText('Save stub'),
        stub =              by.cssContainingText('a', stubTitle);

    it('should create a new stub', function() {
        // Not sure why we need this but it doesn't work without
        browser.ignoreSynchronization = true;

        browser.driver.sleep(8000);
        element(CreateNewButton).click();
        browser.driver.sleep(1000);
        element(createArticle).click();
        browser.driver.sleep(1000);
        element(stubTitleField).sendKeys(stubTitle);
        element(saveStubButton).click();
        browser.driver.sleep(6000);
        console.log('Stub Created: ' + stubTitle);
        expect(ptor.isElementPresent(stub)).toBeTruthy();
  });
});


