import angular from 'angular';

angular.module('wfMediaAtomMakerService', [])
    .service('wfMediaAtomMakerService', ['config', 'wfHttpSessionService', wfMediaAtomMakerService]);

function wfMediaAtomMakerService(config, wfHttpSessionService) {

    const request = wfHttpSessionService.request;

    this.create = function createInMediaAtomMaker(title) {
        console.log("time for some creation", title);
        console.log("url is", config.mediaAtomMakerNewAtom);
        return request({
            method: 'POST',
            url: config.mediaAtomMakerNewAtom,
            data: { 'title': title },
            withCredentials: true
        });
    };

}

