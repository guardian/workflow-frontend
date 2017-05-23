import angular from 'angular';

angular.module('wfMediaAtomMakerService', [])
    .service('wfMediaAtomMakerService', ['config', 'wfHttpSessionService', wfMediaAtomMakerService]);

function wfMediaAtomMakerService(config, wfHttpSessionService) {

    const request = wfHttpSessionService.request;

    this.create = function createInMediaAtomMaker(title) {
        return request({
            method: 'POST',
            url: config.mediaAtomMakerNewAtom,
            data: { 'title': title },
            withCredentials: true
        });
    };

}

