import { CatalogItem } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MDXRemote } from 'next-mdx-remote';
import { Play } from 'lucide-react';

interface ItemTabsProps {
    item: CatalogItem;
    mdxContent: any; // MDXRemoteSerializeResult
}

export function ItemTabs({ item, mdxContent }: ItemTabsProps) {
    return (
        <div className="container mx-auto px-4 py-8">
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4 max-w-[600px] mb-8">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="demo">Demo Info</TabsTrigger>
                    <TabsTrigger value="integrations">Integrations</TabsTrigger>
                    <TabsTrigger value="faqs">FAQs</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-0 space-y-8 animate-in fade-in-50 duration-500">
                    <div className="prose prose-slate max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-a:text-primary">
                        <MDXRemote {...mdxContent} />
                    </div>
                </TabsContent>

                <TabsContent value="demo" className="mt-0 animate-in fade-in-50 duration-500">
                    <Card>
                        <CardHeader>
                            <CardTitle>Available Demo Modes</CardTitle>
                            <CardDescription>Choose how you want to experience this solution.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {item.demoModes.map(mode => (
                                <div key={mode} className="border rounded-lg p-6 bg-secondary/10 flex flex-col items-start gap-4 hover:border-primary/50 transition-colors">
                                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                                        <Play className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-lg capitalize mb-1">{mode} Demo</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {mode === 'interactive' && "Hands-on experience with the live environment."}
                                            {mode === 'video' && "Watch a comprehensive walkthrough of key features."}
                                            {mode === 'guided' && "Step-by-step tutorial with annotated screens."}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="integrations" className="mt-0 animate-in fade-in-50 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Using tech stack as proxy for integrations visualization if not in MDX */}
                        {item.techStack.map(tech => (
                            <Card key={tech}>
                                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                    <div className="w-10 h-10 rounded bg-secondary/30 flex items-center justify-center font-bold text-muted-foreground">
                                        {tech.substring(0, 2).toUpperCase()}
                                    </div>
                                    <CardTitle className="text-base capitalize">{tech}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">Seamless integration available via standard connectors.</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="faqs" className="mt-0 animate-in fade-in-50 duration-500">
                    <Card>
                        <CardHeader>
                            <CardTitle>Common Questions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-muted-foreground">
                                Please refer to the Overview tab for specific FAQs, or contact the owner: <span className="font-medium text-foreground">{item.owner}</span>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
