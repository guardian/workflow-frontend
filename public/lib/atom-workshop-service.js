import angular from 'angular';

angular.module('wfAtomWorkshopService', [])
    .service('wfAtomWorkshopService', ['config', 'wfHttpSessionService', wfAtomWorkshopService]);

function wfAtomWorkshopService(config, wfHttpSessionService) {

    const request = wfHttpSessionService.request;

    this.create = function createInAtomWorkshop(atomType, title) {
        return request({
            method: 'POST',
            url: config.atomWorkshopNewAtom + '/' + atomType,
            data: { 'title': title, commissioningDesks: [] },
            withCredentials: true
        });
    };

}
