import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, User, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/_core/hooks/useAuth";

interface AppealCommentsProps {
  appealId: number;
}

export function AppealComments({ appealId }: AppealCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [commentType, setCommentType] = useState<"internal" | "owner_communication">("internal");
  const { user } = useAuth();
  
  const { data: comments, isLoading, refetch } = trpc.appeals.getComments.useQuery({ appealId });
  const addComment = trpc.appeals.addComment.useMutation({
    onSuccess: () => {
      toast.success("Comment added successfully");
      setNewComment("");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to add comment: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    
    if (!user) {
      toast.error("You must be logged in to add comments");
      return;
    }
    
    addComment.mutate({
      appealId,
      commentType,
      content: newComment.trim(),
      authorId: user.id,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Comments & Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Comment Form */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant={commentType === "internal" ? "default" : "outline"}
              size="sm"
              onClick={() => setCommentType("internal")}
            >
              Internal Note
            </Button>
            <Button
              variant={commentType === "owner_communication" ? "default" : "outline"}
              size="sm"
              onClick={() => setCommentType("owner_communication")}
            >
              Owner Communication
            </Button>
          </div>
          
          <Textarea
            placeholder={
              commentType === "internal"
                ? "Add an internal note (not visible to property owner)..."
                : "Add a message to property owner..."
            }
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="resize-none"
          />
          
          <Button
            onClick={handleSubmit}
            disabled={addComment.isPending || !newComment.trim()}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            {addComment.isPending ? "Adding..." : "Add Comment"}
          </Button>
        </div>

        {/* Comments List */}
        <div className="space-y-3 mt-6">
          {isLoading && (
            <div className="text-center text-muted-foreground py-8">
              Loading comments...
            </div>
          )}
          
          {!isLoading && comments && comments.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No comments yet. Add the first comment above.
            </div>
          )}
          
          {comments && comments.map((comment: any) => (
            <div
              key={comment.id}
              className="border rounded-lg p-4 space-y-2 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm">
                    {comment.authorName || `User #${comment.authorId}`}
                  </span>
                  <Badge
                    variant={comment.commentType === "internal" ? "secondary" : "default"}
                    className="text-xs"
                  >
                    {comment.commentType === "internal" ? "Internal" : "Owner Communication"}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </div>
              </div>
              
              <p className="text-sm text-foreground whitespace-pre-wrap pl-6">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
