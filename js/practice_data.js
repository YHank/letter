// 타자 연습 데이터 로더
// 실제 연습 텍스트는 /data/typing/ 아래에 언어 × 분류별 JSON 파일로 분리되어 있다.
// 데이터를 늘릴 때는 JSON 파일을 추가하고 manifest.json 의 파일 목록에만 등록하면 된다.
//
// manifest.json 구조
//   {
//     "version": 1,
//     "basePath": "/data/typing",
//     "languages": {
//       "korean": { "free": ["korean/free.json", "korean/free.proverbs.json"], ... },
//       "english": { ... }
//     }
//   }
//
// 같은 분류에 여러 파일을 등록하면 순서대로 병합된다.
// (배열은 이어붙이고, 객체는 깊은 병합, 그 외 값은 뒤에 오는 파일이 덮어쓴다)

(function () {
    'use strict';

    // 데이터 캐시 버스터. JSON 파일을 수정하면 이 숫자를 1 증가시킨다.
    var DATA_VERSION = 1;
    var MANIFEST_PATH = '/data/typing/manifest.json';

    // 로드 전에도 practiceTexts[lang] 접근이 터지지 않도록 뼈대를 먼저 만들어 둔다.
    var practiceTexts = window.practiceTexts || { korean: {}, english: {} };
    window.practiceTexts = practiceTexts;

    function isPlainObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    /**
     * 연습 데이터 병합 규칙
     * - 배열 + 배열: 이어붙이기 (문장을 계속 추가하는 경우)
     * - 객체 + 객체: 깊은 병합 (하위 분류를 나눠 담는 경우)
     * - 그 외: 뒤에 오는 값이 덮어쓰기 (paragraph 처럼 문자열 하나인 경우)
     */
    function mergeData(target, source) {
        if (Array.isArray(target) && Array.isArray(source)) {
            return target.concat(source);
        }

        if (isPlainObject(target) && isPlainObject(source)) {
            var merged = {};
            Object.keys(target).forEach(function (key) {
                merged[key] = target[key];
            });
            Object.keys(source).forEach(function (key) {
                merged[key] = Object.prototype.hasOwnProperty.call(merged, key)
                    ? mergeData(merged[key], source[key])
                    : source[key];
            });
            return merged;
        }

        return source;
    }

    function withVersion(url) {
        return url + (url.indexOf('?') === -1 ? '?v=' : '&v=') + DATA_VERSION;
    }

    function fetchJson(url) {
        return fetch(withVersion(url)).then(function (response) {
            if (!response.ok) {
                throw new Error('연습 데이터 로드 실패 (' + response.status + '): ' + url);
            }
            return response.json();
        });
    }

    function joinPath(basePath, relative) {
        var base = (basePath || '').replace(/\/+$/, '');
        var rel = String(relative).replace(/^\/+/, '');
        return base + '/' + rel;
    }

    var manifestData = null;

    function loadAll() {
        return fetchJson(MANIFEST_PATH).then(function (manifest) {
            manifestData = manifest;

            var basePath = manifest.basePath || '/data/typing';
            var languages = manifest.languages || {};
            var jobs = [];

            Object.keys(languages).forEach(function (lang) {
                var categories = languages[lang] || {};
                Object.keys(categories).forEach(function (category) {
                    var files = categories[category] || [];
                    files.forEach(function (file, order) {
                        jobs.push(
                            fetchJson(joinPath(basePath, file)).then(function (data) {
                                return { lang: lang, category: category, order: order, data: data };
                            })
                        );
                    });
                });
            });

            return Promise.all(jobs);
        }).then(function (results) {
            // manifest 에 적힌 순서대로 병합해야 하므로 정렬 후 반영한다.
            results.sort(function (a, b) {
                return a.order - b.order;
            });

            results.forEach(function (result) {
                if (!practiceTexts[result.lang]) {
                    practiceTexts[result.lang] = {};
                }

                var bucket = practiceTexts[result.lang];
                bucket[result.category] = Object.prototype.hasOwnProperty.call(bucket, result.category)
                    ? mergeData(bucket[result.category], result.data)
                    : result.data;
            });

            return practiceTexts;
        });
    }

    var readyPromise = null;

    var PracticeData = {
        /**
         * 연습 데이터 로드 완료 Promise 를 반환한다.
         * 최초 호출 시 로드를 시작하고, 이후에는 같은 Promise 를 재사용한다.
         * @returns {Promise<Object>} practiceTexts
         */
        ready: function () {
            if (!readyPromise) {
                readyPromise = loadAll().catch(function (error) {
                    // 실패한 Promise 를 캐시하면 재시도가 불가능하므로 초기화한다.
                    readyPromise = null;
                    throw error;
                });
            }
            return readyPromise;
        },

        /**
         * 데이터를 비우고 다시 로드한다. (JSON 을 갱신했을 때 사용)
         * @returns {Promise<Object>} practiceTexts
         */
        reload: function () {
            readyPromise = null;
            Object.keys(practiceTexts).forEach(function (lang) {
                practiceTexts[lang] = {};
            });
            return this.ready();
        },

        /**
         * 로드된 manifest 원본을 반환한다. (아직 로드 전이면 null)
         * @returns {Object|null}
         */
        getManifest: function () {
            return manifestData;
        },

        /**
         * 지정한 언어의 분류 목록을 반환한다.
         * @param {string} lang - 'korean' | 'english'
         * @returns {string[]}
         */
        getCategories: function (lang) {
            if (!manifestData || !manifestData.languages || !manifestData.languages[lang]) {
                return [];
            }
            return Object.keys(manifestData.languages[lang]);
        },

        get data() {
            return practiceTexts;
        },

        get version() {
            return DATA_VERSION;
        }
    };

    window.PracticeData = PracticeData;

    // 스크립트가 로드되는 즉시 미리 받아두어 초기화 지연을 최소화한다.
    PracticeData.ready().catch(function (error) {
        console.error('타자 연습 데이터 로드 실패:', error);
    });
})();
