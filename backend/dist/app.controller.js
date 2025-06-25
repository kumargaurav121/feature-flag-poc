"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const app_service_1 = require("./app.service");
let AppController = class AppController {
    appService;
    constructor(appService) {
        this.appService = appService;
    }
    getHello() {
        return this.appService.getHello();
    }
    getHealth() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'NestJS Backend',
            version: '1.0.0',
        };
    }
    getManualLocations() {
        return [
            {
                city: 'New York',
                country: 'United States',
                countryCode: 'US',
                region: 'North America',
            },
            {
                city: 'London',
                country: 'United Kingdom',
                countryCode: 'UK',
                region: 'Europe',
            },
            { city: 'Tokyo', country: 'Japan', countryCode: 'JP', region: 'Asia' },
            {
                city: 'Sydney',
                country: 'Australia',
                countryCode: 'AU',
                region: 'Oceania',
            },
            { city: 'Mumbai', country: 'India', countryCode: 'IN', region: 'Asia' },
            {
                city: 'Toronto',
                country: 'Canada',
                countryCode: 'CA',
                region: 'North America',
            },
            {
                city: 'Berlin',
                country: 'Germany',
                countryCode: 'DE',
                region: 'Europe',
            },
            { city: 'Paris', country: 'France', countryCode: 'FR', region: 'Europe' },
            {
                city: 'Singapore',
                country: 'Singapore',
                countryCode: 'SG',
                region: 'Asia',
            },
            {
                city: 'São Paulo',
                country: 'Brazil',
                countryCode: 'BR',
                region: 'South America',
            },
            {
                city: 'Mexico City',
                country: 'Mexico',
                countryCode: 'MX',
                region: 'North America',
            },
            {
                city: 'Cape Town',
                country: 'South Africa',
                countryCode: 'ZA',
                region: 'Africa',
            },
        ];
    }
    getFeatureFlags(locationData) {
        const { latitude, longitude, country, city, method = 'unknown', } = locationData;
        let darkMode = false;
        let premiumFeatures = false;
        let betaFeatures = false;
        if (country &&
            ['US', 'UK', 'CA', 'IN', 'INDIA'].includes(country.toUpperCase())) {
            darkMode = true;
        }
        if (city &&
            ['New York', 'London', 'Tokyo', 'Sydney', 'Mumbai', 'Delhi'].includes(city)) {
            premiumFeatures = true;
        }
        if (latitude && longitude) {
            if (latitude >= 37.0 &&
                latitude <= 38.0 &&
                longitude >= -122.5 &&
                longitude <= -121.5) {
                betaFeatures = true;
            }
        }
        return {
            darkMode,
            premiumFeatures,
            betaFeatures,
            location: `${city || 'Unknown'}, ${country || 'Unknown'}`,
            timestamp: new Date().toISOString(),
            detectionMethod: method,
        };
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], AppController.prototype, "getHello", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)('manual-locations'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Array)
], AppController.prototype, "getManualLocations", null);
__decorate([
    (0, common_1.Post)('feature-flags'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], AppController.prototype, "getFeatureFlags", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [app_service_1.AppService])
], AppController);
//# sourceMappingURL=app.controller.js.map