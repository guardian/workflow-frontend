import priorityTemplate           from "components/content-list-item/templates/priority.html";
import contentTypeTemplate        from "components/content-list-item/templates/content-type.html";
import titleTemplate              from "components/content-list-item/templates/title.html";
import commentsTemplate           from "components/content-list-item/templates/comments.html";
import mainImageTemplate          from "components/content-list-item/templates/main-image.html";
import incopyTemplate             from "components/content-list-item/templates/incopy.html";
import optimisedForWebTemplate    from "components/content-list-item/templates/optimisedForWeb.html";
import sensitiveTemplate          from "components/content-list-item/templates/sensitive.html";
import legallySensitiveTemplate   from "components/content-list-item/templates/legallySensitive.html";
import presenceTemplate           from "components/content-list-item/templates/presence.html";
import assigneeTemplate           from "components/content-list-item/templates/assignee.html";
import officeTemplate             from "components/content-list-item/templates/office.html";
import deadlineTemplate           from "components/content-list-item/templates/deadline.html";
import sectionTemplate            from "components/content-list-item/templates/section.html";
import statusTemplate             from "components/content-list-item/templates/status.html";
import notesTemplate              from "components/content-list-item/templates/notes.html";
import linksTemplate              from "components/content-list-item/templates/links.html";
import previewTemplate            from "components/content-list-item/templates/preview.html";
import publishedStateTemplate     from "components/content-list-item/templates/published-state.html";
import wordcountTemplate          from "components/content-list-item/templates/wordcount.html";
import printWordcountTemplate     from "components/content-list-item/templates/printwordcount.html";
import commissionedLengthTemplate from "components/content-list-item/templates/commissionedLength.html";
import needsLegalTemplate         from "components/content-list-item/templates/needsLegal.html";
import lastModifiedTemplate       from "components/content-list-item/templates/last-modified.html";
import lastModifiedByTemplate     from "components/content-list-item/templates/last-modified-by.html";

/**
 * This array represents the default ordering and display of the content-list-item columns for workflow.
 * It will be used as default or overridden by an individual users preferences.
 * @type {
 *      name: string, // the css classname / identifier of the field
 *      prettyName: '',
 *      labelHTML: string, // HTML, if any, to be used as the column heading contents
 *      colspan: number, // colspan of this field
 *      title: string, // title attribute contents for the column heading
 *      templateUrl: string // URL for the content-list-item template for this field
 * }
 */

var templateRoot = '/assets/components/content-list-item/templates/';

var columnDefaults = [{
    name: 'priority',
    prettyName: 'Priority',
    labelHTML: '',
    colspan: 1,
    title: '',
    templateUrl: templateRoot + 'priority.html',
    template: priorityTemplate,
    active: true
},{
    name: 'content-type',
    prettyName: 'Content Type',
    labelHTML: '',
    colspan: 1,
    title: '',
    templateUrl: templateRoot + 'content-type.html',
    template: contentTypeTemplate,
    active: true
},{
    name: 'titles',
    prettyName: 'Working title / Headline',
    labelHTML: 'Working title / Headline',
    colspan: 1,
    title: '',
    templateUrl: templateRoot + 'title.html',
    template: titleTemplate,
    active: true
},{
    name: 'notes',
    prettyName: 'Notes',
    labelHTML: 'Notes',
    colspan: 1,
    title: '',
    templateUrl: templateRoot + 'notes.html',
    template: notesTemplate,
    active: true
},{
    name: 'comments',
    prettyName: 'Comments: On/Off',
    labelHTML: '',
    colspan: 1,
    title: '',
    templateUrl: templateRoot + 'comments.html',
    template: commentsTemplate,
    active: true
},{
    name: 'main-image',
    prettyName: 'Main Image',
    labelHTML: '',
    colspan: 1,
    title: '',
    templateUrl: templateRoot + 'main-image.html',
    template: mainImageTemplate,
    active: true
},{
    name: 'incopy',
    prettyName: 'InCopy',
    labelHTML: '',
    colspan: 1,
    title: '',
    templateUrl: templateRoot + 'incopy.html',
    template: incopyTemplate,
    active: true
},{
    name: 'optimisedForWeb',
    prettyName: 'Optimised For Web',
    labelHTML: '',
    colspan: 1,
    title: '',
    templateUrl: templateRoot + 'optimisedForWeb.html',
    template: optimisedForWebTemplate,
    active: true,
    isNew: false
},{
    name: 'sensitive',
    prettyName: 'Sensitive',
    labelHTML: '',
    colspan: 1,
    title: '',
    templateUrl: templateRoot + 'sensitive.html',
    template: sensitiveTemplate,
    active: false
},{
    name: 'legallySensitive',
    prettyName: 'Legally sensitive',
    labelHTML: '',
    colspan: 1,
    title: '',
    templateUrl: templateRoot + 'legallySensitive.html',
    template: legallySensitiveTemplate,
    active: false
},{
    name: 'presence',
    prettyName: 'Presence',
    labelHTML: '<div ng-switch="presenceIsActive"><i class="content-list-head__heading-icon--presence" ng-switch-when="false" wf-icon="presence-unavailable"/><i class="content-list-head__heading-icon--presence" ng-switch-default wf-icon="presence"/></div>',
    colspan: 1,
    title: 'In use by',
    unavailableTitle: 'Presence is currently unavailable, reloading your browser might fix this.',
    templateUrl: templateRoot + 'presence.html',
    template: presenceTemplate,
    active: true
},{
    name: 'assignee',
    prettyName: 'Assignee',
    labelHTML: '<i class="content-list-head__heading-icon--assignee" wf-icon="assigned-to"/>',
    colspan: 1,
    title: 'Assigned to',
    templateUrl: templateRoot + 'assignee.html',
    template: assigneeTemplate,
    active: true
},{
    name: 'office',
    prettyName: 'Office',
    labelHTML: 'Office',
    colspan: 1,
    title: '',
    templateUrl: templateRoot + 'office.html',
    template: officeTemplate,
    active: true
},{
    name: 'deadline',
    prettyName: 'Deadline',
    labelHTML: 'Deadline',
    colspan: 1,
    title: '',
    templateUrl: templateRoot + 'deadline.html',
    template: deadlineTemplate,
    active: true
},{
    name: 'section',
    prettyName: 'Section',
    labelHTML: 'Section',
    colspan: 1,
    title: '',
    templateUrl: templateRoot + 'section.html',
    template: sectionTemplate,
    active: true
},{
    name: 'status',
    prettyName: 'Status',
    labelHTML: 'Status',
    colspan: 1,
    title: '',
    templateUrl: templateRoot + 'status.html',
    template: statusTemplate,
    active: true
},{
    name: 'wordcount',
    prettyName: 'Web Wordcount',
    labelHTML: 'Web Words',
    colspan: 1,
    title: '',
    templateUrl: templateRoot + 'wordcount.html',
    template: wordcountTemplate,
    active: false
},{
    name: 'printwordcount',
    prettyName: 'Print Wordcount',
    labelHTML: 'Print Words',
    colspan: 1,
    title: '',
    templateUrl: templateRoot + 'printwordcount.html',
    template: printWordcountTemplate,
    active: false,
    isNew: true
},{
    name: 'commissionedLength',
    prettyName: 'Commissioned Length',
    labelHTML: 'Commission',
    colspan: 1,
    title: '',
    templateUrl: templateRoot + 'commissionedLength.html',
    template: commissionedLengthTemplate,
    active: false
},{
    name: 'links',
    prettyName: 'Open in...',
    labelHTML: 'Open in',
    colspan: 3,
    title: '',
    templateUrl: templateRoot + 'links.html',
    template: linksTemplate,
    active: true
},{
    name: 'preview',
    prettyName: 'Preview',
    labelHTML: 'Preview',
    title: '',
    templateUrl: templateRoot + 'preview.html',
    template: previewTemplate,
    active: true
},{
    name: 'published-state',
    prettyName: 'Published State',
    labelHTML: 'State',
    colspan: 1,
    title: '',
    templateUrl: templateRoot + 'published-state.html',
    template: publishedStateTemplate,
    active: true
},{
    name: 'needsLegal',
    prettyName: 'Needs Legal',
    labelHTML: '',
    colspan: 1,
    title: '',
    templateUrl: templateRoot + 'needsLegal.html',
    template: needsLegalTemplate,
    active: true
},{
    name: 'last-modified',
    prettyName: 'Last modified',
    labelHTML: 'Last modified',
    colspan: 1,
    title: '',
    templateUrl: templateRoot + 'last-modified.html',
    template: lastModifiedTemplate,
    active: false,
    isNew: true
},{
    name: 'last-modified-by',
    prettyName: 'Last modified by',
    labelHTML: 'Last modified by',
    colspan: 1,
    title: '',
    templateUrl: templateRoot + 'last-modified-by.html',
    template: lastModifiedByTemplate,
    active: false,
    isNew: true
}];

export { columnDefaults }
