"use strict";

module.exports.init = function (config, bloggify) {

    config.paths.blog = config.paths.blog.replace(/\/$/, "");

    // Article pages
    bloggify.server.addPage(config.paths.blog + "/:articleId-?:articleSlug?", lien => {
        let articleId = lien.params.articleId = parseInt(lien.params.articleId);

        if (articleId < 1 || isNaN(articleId)) {
            return this.emit("not_found", lien);
        }

        this.emit("article", lien);
    });

    let blogPageFn = lien => {
        let pageNumber = lien.params.pageNumber = parseInt(lien.params.pageNumber);

        if (pageNumber < 1 || isNaN(pageNumber)) {
            return this.emit("not_found", lien);
        }

        this.emit("blog_page", lien);
    };

    // Blog pages
    bloggify.server.addPage((config.paths.blog || "/blog") + "/page/:pageNumber", blogPageFn);

    let sitePageUrl = "/:sitePage";
    if (config.paths.blog !== "/") {
        sitePageUrl += "?";
    }

    bloggify.server.addPage(config.paths.blog || "/", lien => {
        lien.params.pageNumber = 1;
        blogPageFn(lien);
    });

    // Site pages
    bloggify.server.addPage(sitePageUrl, lien => {
        if (!lien.params.sitePage) {
            lien.params.sitePage = "_home";
        }
        this.emit("site_page", lien);
    });

    // Handle the error pages
    bloggify.server.errorPages({
        notFound: lien => {
            this.emit("not_found", lien);
        }
      , serverError: lien => {
            this.emit("server_error", lien);
        }
    });
};
