import priorityTemplate         from "components/content-list-item/templates/priority.html!text";
import contentTypeTemplate      from "components/content-list-item/templates/content-type.html!text";
import titleTemplate            from "components/content-list-item/templates/title.html!text";
import commentsTemplate         from "components/content-list-item/templates/comments.html!text";
import mainImageTemplate        from "components/content-list-item/templates/main-image.html!text";
import incopyTemplate           from "components/content-list-item/templates/incopy.html!text";
import presenceTemplate         from "components/content-list-item/templates/presence.html!text";
import assigneeTemplate         from "components/content-list-item/templates/assignee.html!text";
import officeTemplate           from "components/content-list-item/templates/office.html!text";
import deadlineTemplate         from "components/content-list-item/templates/deadline.html!text";
import sectionTemplate          from "components/content-list-item/templates/section.html!text";
import statusTemplate           from "components/content-list-item/templates/status.html!text";
import notesTemplate            from "components/content-list-item/templates/notes.html!text";
import linksTemplate            from "components/content-list-item/templates/links.html!text";
import publishedStateTemplate   from "components/content-list-item/templates/published-state.html!text";
import wordcountTemplate        from "components/content-list-item/templates/wordcount.html!text";
import needsLegalTemplate       from "components/content-list-item/templates/needsLegal.html!text";

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
    name: 'presence',
    prettyName: 'Presence',
    labelHTML: '<i class="content-list-head__heading-icon--presence" wf-icon="presence"/>',
    colspan: 1,
    title: 'In use by',
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
    name: 'notes',
    prettyName: 'Notes',
    labelHTML: 'Notes',
    colspan: 1,
    title: '',
    templateUrl: templateRoot + 'notes.html',
    template: notesTemplate,
    active: true
},{
    name: 'wordcount',
    prettyName: 'Wordcount',
    labelHTML: 'Words',
    colspan: 1,
    title: '',
    templateUrl: templateRoot + 'wordcount.html',
    template: wordcountTemplate,
    active: false
},{
    name: 'links',
    prettyName: 'Open in...',
    labelHTML: 'Open in',
    colspan: 4,
    title: '',
    templateUrl: templateRoot + 'links.html',
    template: linksTemplate,
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
}];

export { columnDefaults }
