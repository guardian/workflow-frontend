// spec.js

var workflowUri = "https://workflow.code.dev-gutools.co.uk";
var ptor    = protractor.getInstance();
var driver  = ptor.driver;

describe('stub creation', function() {
  it('should create a new stub', function() {
    var datePicked = by.cssContainingText('.help-block','20:00 BST');
    var random = Math.round(Math.random() * 1000000);
    var stubTitle = ('Stubtitle' + random);
    var stub = by.cssContainingText('li', stubTitle);
    var datePicker = by.id("wfDateTimePickerText1");
    var saveStubButton = by.partialButtonText('Save stub');
    var sectionDropdown = by.model('selectedSection');
    var technologyOption = by.cssContainingText('option', 'Technology');
    var newStubButton = by.partialButtonText('New Stub');
    var stubTitleField = by.id("stub_title");
    browser.ignoreSynchronization = true;
    browser.get(workflowUri);
    //redirects to google login page
    browser.driver.findElement(by.id("Email")).sendKeys("composer.test@guardian.co.uk");
    browser.driver.findElement(by.id("Passwd")).sendKeys("2&rDC*Ej");
    browser.driver.findElement(by.id("signIn")).click();
    browser.driver.sleep(5000);
    ptor.waitForAngular();
    expect(browser.getTitle()).toEqual('Welcome to Workflow');
    element(newStubButton).click();
    element(stubTitleField).sendKeys(stubTitle);
    element(datePicker).sendKeys("8pm");
    browser.wait(function() {
       return ptor.isElementPresent(datePicked);
   }, 8000);
    expect(ptor.isElementPresent(datePicked)).toBeTruthy();
    element(saveStubButton).click();
    browser.driver.sleep(5000);
    element(sectionDropdown).click();
    element(technologyOption).click();
    ptor.waitForAngular();
    expect(ptor.isElementPresent(stub)).toBeTruthy();
  });
});


