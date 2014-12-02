/**
 * This array represents the default ordering and display of the content-list-item columns for workflow.
 * It will be used as default or overridden by an individual users preferences.
 * @type {
 *      name: string, // the css classname / identifier of the field
 *      labelHTML: string, // HTML, if any, to be used as the column heading contents
 *      colspan: number, // colspan of this field
 *      title: string, // title attribute contents for the column heading
 *      templateUrl: string // URL for the content-list-item template for this field
 * }
 */

var templateRoot = '/assets/components/content-list-item/templates/';

var columnDefaults = [{
    name: 'prority',
    labelHTML: '',
    colspan: 0,
    title: '',
    templateUrl: templateRoot + 'priority.html',
    active: true
},{
    name: 'content-type',
    labelHTML: '',
    colspan: 0,
    title: '',
    templateUrl: templateRoot + 'content-type.html',
    active: true
},{
    name: 'titles',
    labelHTML: 'Working title / Headline',
    colspan: 1,
    title: '',
    templateUrl: templateRoot + 'title.html',
    active: true
},{
    name: 'comments',
    labelHTML: '',
    colspan: 0,
    title: '',
    templateUrl: templateRoot + 'comments.html',
    active: true
},{
    name: 'main-image',
    labelHTML: '',
    colspan: 0,
    title: '',
    templateUrl: templateRoot + 'main-image.html',
    active: true
},{
    name: 'incopy',
    labelHTML: '',
    colspan: 0,
    title: '',
    templateUrl: templateRoot + 'incopy.html',
    active: true
},{
    name: 'presence',
    labelHTML: '<i class="content-list-head__heading-icon--presence" wf-icon="presence"/>',
    colspan: 1,
    title: 'In use by (Coming soon)',
    templateUrl: templateRoot + 'presence.html',
    active: true
},{
    name: 'assignee',
    labelHTML: '<i class="content-list-head__heading-icon--assignee" wf-icon="assigned-to"/>',
    colspan: 1,
    title: 'Assigned to',
    templateUrl: templateRoot + 'assignee.html',
    active: true
},{
    name: 'office',
    labelHTML: 'Office',
    colspan: 1,
    title: '',
    templateUrl: templateRoot + 'office.html',
    active: true
},{
    name: 'deadline',
    labelHTML: 'Deadline',
    colspan: 1,
    title: '',
    templateUrl: templateRoot + 'deadline.html',
    active: true
},{
    name: 'section',
    labelHTML: 'Section',
    colspan: 1,
    title: '',
    templateUrl: templateRoot + 'section.html',
    active: true
},{
    name: 'status',
    labelHTML: 'Status',
    colspan: 1,
    title: '',
    templateUrl: templateRoot + 'status.html',
    active: true
},{
    name: 'notes',
    labelHTML: 'Notes',
    colspan: 1,
    title: '',
    templateUrl: templateRoot + 'notes.html',
    active: true
},{
    name: 'links',
    labelHTML: 'Open in',
    colspan: 4,
    title: '',
    templateUrl: templateRoot + 'links.html',
    active: true
},{
    name: 'published-state',
    labelHTML: 'State',
    colspan: 1,
    title: '',
    templateUrl: templateRoot + 'published-state.html',
    active: true
}];

export { columnDefaults }
