
module Jekyll
  module FancyToCFilter
    def fancytoc(input)
      converter = Redcarpet::Markdown.new(Redcarpet::Render::HTML_TOC)
      toc = converter.render(input)
      toc.gsub(/<ul>/, '<ul class="nav">') unless toc.empty?
    end
  end
end

Liquid::Template.register_filter(Jekyll::FancyToCFilter)