import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = Readonly<{
  title: string;
  description: string;
}>;

export function TabPlaceholder({ title, description }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
