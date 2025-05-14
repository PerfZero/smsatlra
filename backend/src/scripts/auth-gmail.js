"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var googleapis_1 = require("googleapis");
var local_auth_1 = require("@google-cloud/local-auth");
var path = require("path");
var fs = require("fs");
// Скрипт для однократной аутентификации в Gmail API
// Запускается отдельно от основного приложения
var SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify'
];
var TOKEN_PATH = path.join(process.cwd(), 'token.json');
var CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
function saveCredentials(client) {
    return __awaiter(this, void 0, void 0, function () {
        var content, keys, key, payload;
        return __generator(this, function (_a) {
            try {
                console.log('Сохранение учетных данных...');
                content = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
                keys = JSON.parse(content);
                key = keys.installed || keys.web;
                payload = JSON.stringify({
                    type: 'authorized_user',
                    client_id: key.client_id,
                    client_secret: key.client_secret,
                    refresh_token: client.credentials.refresh_token,
                });
                fs.writeFileSync(TOKEN_PATH, payload);
                console.log('Учетные данные сохранены в token.json');
            }
            catch (err) {
                console.error('Ошибка при сохранении учетных данных:', err);
            }
            return [2 /*return*/];
        });
    });
}
function authGmail() {
    return __awaiter(this, void 0, void 0, function () {
        var client, gmail, profile, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    console.log('Запускаем процесс аутентификации в Gmail API...');
                    // Проверяем наличие файла credentials.json
                    if (!fs.existsSync(CREDENTIALS_PATH)) {
                        console.error('Файл credentials.json не найден!');
                        console.error('Пожалуйста, создайте OAuth 2.0 клиента в Google Cloud Console и скачайте credentials.json');
                        return [2 /*return*/];
                    }
                    console.log('Запрашиваем аутентификацию через браузер...');
                    return [4 /*yield*/, (0, local_auth_1.authenticate)({
                            scopes: SCOPES,
                            keyfilePath: CREDENTIALS_PATH,
                        })];
                case 1:
                    client = _a.sent();
                    if (!client.credentials) return [3 /*break*/, 4];
                    return [4 /*yield*/, saveCredentials(client)];
                case 2:
                    _a.sent();
                    console.log('Аутентификация успешна!');
                    gmail = googleapis_1.google.gmail({ version: 'v1', auth: client });
                    return [4 /*yield*/, gmail.users.getProfile({ userId: 'me' })];
                case 3:
                    profile = _a.sent();
                    console.log("\u0423\u0441\u043F\u0435\u0448\u043D\u043E \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u043B\u0438\u0441\u044C \u043A Gmail \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0443: ".concat(profile.data.emailAddress));
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    error_1 = _a.sent();
                    console.error('Ошибка при аутентификации:', error_1);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// Запускаем аутентификацию
authGmail();
